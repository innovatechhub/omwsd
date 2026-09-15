-- OMSWD enhancement: enforce AICS eligibility, retain explainable match flags,
-- and make the application review workflow auditable at the database boundary.

alter table public.assistance_types
  add column if not exists program_group text,
  add column if not exists cooldown_days integer,
  add column if not exists event_window_days integer,
  add column if not exists minimum_amount numeric(12,2),
  add column if not exists maximum_amount numeric(12,2);

update public.assistance_types
set program_group = 'aics',
    cooldown_days = 365,
    event_window_days = 90,
    minimum_amount = 1000,
    maximum_amount = 4000
where slug in ('medical-assistance', 'burial-assistance');

alter table public.applications
  add column if not exists event_date date,
  add column if not exists approved_amount numeric(12,2),
  add column if not exists eligibility_checked_at timestamptz,
  add column if not exists eligibility_reason text,
  add column if not exists next_eligible_date date;

alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check check (status in (
  'draft', 'pending_verification', 'under_review', 'for_requirements',
  'for_correction', 'for_interview', 'approved', 'rejected', 'completed', 'cancelled'
));

create table if not exists public.application_match_flags (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  matched_application_id uuid not null references public.applications(id) on delete cascade,
  match_type text not null check (match_type in ('household_member_name')),
  matched_value text not null,
  status text not null default 'open' check (status in ('open', 'dismissed', 'confirmed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (application_id, matched_application_id, match_type, matched_value)
);

create index if not exists idx_applications_aics_eligibility
  on public.applications (applicant_profile_id, submitted_at desc, assistance_type_id);
create index if not exists idx_application_match_flags_application
  on public.application_match_flags (application_id, status);

-- Backfill legacy files that stored the requirement label in remarks.
update public.uploaded_documents document
set application_requirement_id = application_requirement.id
from public.application_requirements application_requirement
join public.assistance_requirements requirement
  on requirement.id = application_requirement.requirement_id
where document.application_requirement_id is null
  and document.application_id = application_requirement.application_id
  and lower(trim(coalesce(document.remarks, ''))) = lower(trim(requirement.name));

create or replace function public.normalize_person_name(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.check_assistance_eligibility(
  p_assistance_type_id uuid,
  p_applicant_profile_id uuid,
  p_event_date date default null,
  p_exclude_application_id uuid default null
)
returns table (
  eligible boolean,
  reason text,
  next_eligible_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type public.assistance_types%rowtype;
  v_last_submission date;
begin
  select * into v_type
  from public.assistance_types
  where id = p_assistance_type_id and is_active = true;

  if not found then
    return query select false, 'The selected assistance program is unavailable.', null::date;
    return;
  end if;

  if v_type.program_group <> 'aics' then
    return query select true, 'Eligible for program review.', null::date;
    return;
  end if;

  if p_event_date is null then
    return query select false, 'Enter the hospitalization, medical checkup, or bereavement date.', null::date;
    return;
  end if;

  if p_event_date > current_date then
    return query select false, 'The event date cannot be in the future.', null::date;
    return;
  end if;

  if p_event_date < current_date - coalesce(v_type.event_window_days, 90) then
    return query select false,
      format('AICS documents must relate to an event within the last %s days.', coalesce(v_type.event_window_days, 90)),
      null::date;
    return;
  end if;

  select a.submitted_at::date into v_last_submission
  from public.applications a
  join public.assistance_types previous_type on previous_type.id = a.assistance_type_id
  where a.applicant_profile_id = p_applicant_profile_id
    and previous_type.program_group = 'aics'
    and a.status not in ('rejected', 'cancelled')
    and (p_exclude_application_id is null or a.id <> p_exclude_application_id)
  order by a.submitted_at desc
  limit 1;

  if v_last_submission is not null
     and current_date < v_last_submission + coalesce(v_type.cooldown_days, 365) then
    return query select false,
      'An AICS application has already been filed during the annual eligibility period.',
      v_last_submission + coalesce(v_type.cooldown_days, 365);
    return;
  end if;

  return query select true, 'Eligible for AICS review.', null::date;
end;
$$;

grant execute on function public.check_assistance_eligibility(uuid, uuid, date, uuid)
to authenticated;

create or replace function public.enforce_application_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result record;
  v_type public.assistance_types%rowtype;
begin
  select * into v_result
  from public.check_assistance_eligibility(
    new.assistance_type_id,
    new.applicant_profile_id,
    new.event_date,
    case when tg_op = 'UPDATE' then new.id else null end
  );

  if not v_result.eligible then
    raise exception using
      errcode = 'P0001',
      message = v_result.reason,
      detail = case when v_result.next_eligible_date is null then null
        else 'Next eligible date: ' || to_char(v_result.next_eligible_date, 'FMMonth DD, YYYY') end;
  end if;

  select * into v_type from public.assistance_types where id = new.assistance_type_id;
  if v_type.program_group = 'aics' and new.approved_amount is not null and
     (new.approved_amount < coalesce(v_type.minimum_amount, 1000)
      or new.approved_amount > coalesce(v_type.maximum_amount, 4000)) then
    raise exception 'Approved AICS amount must be between PHP % and PHP %.',
      coalesce(v_type.minimum_amount, 1000), coalesce(v_type.maximum_amount, 4000);
  end if;

  new.eligibility_checked_at = timezone('utc', now());
  new.eligibility_reason = v_result.reason;
  new.next_eligible_date = v_result.next_eligible_date;
  return new;
end;
$$;

drop trigger if exists enforce_application_eligibility_on_write on public.applications;
create trigger enforce_application_eligibility_on_write
before insert or update of assistance_type_id, applicant_profile_id, event_date
on public.applications
for each row execute function public.enforce_application_eligibility();

create or replace function public.enforce_aics_amount_range()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type public.assistance_types%rowtype;
begin
  select * into v_type from public.assistance_types where id = new.assistance_type_id;
  if v_type.program_group = 'aics' and new.approved_amount is not null and
     (new.approved_amount < coalesce(v_type.minimum_amount, 1000)
      or new.approved_amount > coalesce(v_type.maximum_amount, 4000)) then
    raise exception 'Approved AICS amount must be between PHP % and PHP %.',
      coalesce(v_type.minimum_amount, 1000), coalesce(v_type.maximum_amount, 4000);
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_aics_amount_range_on_write on public.applications;
create trigger enforce_aics_amount_range_on_write
before insert or update of assistance_type_id, approved_amount on public.applications
for each row execute function public.enforce_aics_amount_range();

create or replace function public.flag_possible_household_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.assistance_types current_type
    where current_type.id = new.assistance_type_id and current_type.program_group = 'aics'
  ) then
    return new;
  end if;

  insert into public.application_match_flags (
    application_id, matched_application_id, match_type, matched_value
  )
  select distinct new.id, prior.id, 'household_member_name', current_member.normalized_name
  from jsonb_array_elements(coalesce(new.family_composition, '[]'::jsonb)) current_json
  cross join lateral (
    select public.normalize_person_name(current_json ->> 'name') as normalized_name
  ) current_member
  join public.applications prior on prior.id <> new.id
  join public.assistance_types prior_type on prior_type.id = prior.assistance_type_id
  cross join lateral jsonb_array_elements(coalesce(prior.family_composition, '[]'::jsonb)) prior_json
  where current_member.normalized_name <> ''
    and prior_type.program_group = 'aics'
    and prior.status not in ('rejected', 'cancelled')
    and public.normalize_person_name(prior_json ->> 'name') = current_member.normalized_name
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists flag_possible_household_matches_on_insert on public.applications;
create trigger flag_possible_household_matches_on_insert
after insert on public.applications
for each row execute function public.flag_possible_household_matches();

create or replace function public.notify_application_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.applicant_profile_id is not null then
    insert into public.notifications (recipient_id, title, message, category, link_url)
    values (
      new.applicant_profile_id,
      'Application received',
      coalesce(new.eligibility_reason, 'Your request was received and is ready for OMSWD review.'),
      'application',
      '/resident/dashboard'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_application_received_on_insert on public.applications;
create trigger notify_application_received_on_insert
after insert on public.applications
for each row execute function public.notify_application_received();

create or replace function public.notify_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_message text;
begin
  if new.status is not distinct from old.status or new.applicant_profile_id is null then
    return new;
  end if;

  v_title := case new.status
    when 'for_correction' then 'Application needs correction'
    when 'for_interview' then 'Application ready for interview'
    when 'approved' then 'Application approved'
    when 'rejected' then 'Application decision'
    else 'Application status updated'
  end;
  v_message := coalesce(nullif(new.admin_remarks, ''),
    'Your application status is now ' || replace(new.status, '_', ' ') || '.');

  insert into public.notifications (recipient_id, title, message, category, link_url)
  values (new.applicant_profile_id, v_title, v_message, 'application', '/resident/dashboard');
  return new;
end;
$$;

drop trigger if exists notify_application_status_change_on_update on public.applications;
create trigger notify_application_status_change_on_update
after update of status on public.applications
for each row execute function public.notify_application_status_change();

alter table public.application_match_flags enable row level security;
drop policy if exists "application_match_flags_staff_select" on public.application_match_flags;
create policy "application_match_flags_staff_select"
on public.application_match_flags for select
using (public.has_role(array['admin', 'super_admin', 'social_worker']));
drop policy if exists "application_match_flags_staff_update" on public.application_match_flags;
create policy "application_match_flags_staff_update"
on public.application_match_flags for update
using (public.has_role(array['admin', 'super_admin', 'social_worker']))
with check (public.has_role(array['admin', 'super_admin', 'social_worker']));

-- Approval is only allowed when every required requirement is approved.
create or replace function public.enforce_complete_review_before_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' and exists (
    select 1
    from public.application_requirements ar
    join public.assistance_requirements requirement on requirement.id = ar.requirement_id
    where ar.application_id = new.id
      and requirement.is_required = true
      and ar.status <> 'approved'
  ) then
    raise exception 'All required documents must be reviewed and approved first.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_complete_review_before_approval on public.applications;
create trigger enforce_complete_review_before_approval
before update of status on public.applications
for each row execute function public.enforce_complete_review_before_approval();

create or replace function public.enforce_document_before_requirement_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and not exists (
    select 1 from public.uploaded_documents document
    where document.application_requirement_id = new.id
      and document.status <> 'archived'
  ) then
    raise exception 'A requirement cannot be approved until its document is uploaded.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_document_before_requirement_approval on public.application_requirements;
create trigger enforce_document_before_requirement_approval
before update of status on public.application_requirements
for each row execute function public.enforce_document_before_requirement_approval();
