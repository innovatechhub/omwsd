alter table public.profiles enable row level security;
alter table public.status_histories enable row level security;

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
with check (
  auth.uid() = id
  or public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "status_histories_insert_initial_or_admin" on public.status_histories;
create policy "status_histories_insert_initial_or_admin"
on public.status_histories
for insert
with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
  or (
    changed_by = auth.uid()
    and previous_status is null
    and new_status = 'pending_verification'
    and exists (
      select 1
      from public.applications a
      where a.id = application_id
        and a.applicant_profile_id = auth.uid()
    )
  )
);
