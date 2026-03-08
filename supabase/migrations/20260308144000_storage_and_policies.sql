insert into storage.buckets (id, name, public)
values
  ('resident-documents', 'resident-documents', false),
  ('application-documents', 'application-documents', false),
  ('ids', 'ids', false),
  ('requirements', 'requirements', false)
on conflict (id) do update
set public = excluded.public;

alter table public.profiles enable row level security;
alter table public.residents enable row level security;
alter table public.assistance_types enable row level security;
alter table public.assistance_requirements enable row level security;
alter table public.applications enable row level security;
alter table public.application_requirements enable row level security;
alter table public.uploaded_documents enable row level security;
alter table public.verification_logs enable row level security;
alter table public.status_histories enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.faqs enable row level security;
alter table public.barangays enable row level security;
alter table public.municipalities enable row level security;
alter table public.audit_logs enable row level security;
alter table public.email_logs enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.settings enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select using (
  auth.uid() = id or public.has_role(array['admin', 'super_admin', 'social_worker'])
);
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update using (
  auth.uid() = id or public.has_role(array['admin', 'super_admin'])
) with check (
  auth.uid() = id or public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "roles_admin_only" on public.roles;
create policy "roles_admin_only" on public.roles for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);
drop policy if exists "user_roles_admin_only" on public.user_roles;
create policy "user_roles_admin_only" on public.user_roles for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "locations_select_authenticated" on public.municipalities;
create policy "locations_select_authenticated" on public.municipalities for select using (
  auth.role() = 'authenticated'
);
drop policy if exists "barangays_select_authenticated" on public.barangays;
create policy "barangays_select_authenticated" on public.barangays for select using (
  auth.role() = 'authenticated'
);
drop policy if exists "locations_admin_manage" on public.municipalities;
create policy "locations_admin_manage" on public.municipalities for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);
drop policy if exists "barangays_admin_manage" on public.barangays;
create policy "barangays_admin_manage" on public.barangays for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "residents_select_own_or_admin" on public.residents;
create policy "residents_select_own_or_admin" on public.residents for select using (
  profile_id = auth.uid() or public.has_role(array['admin', 'super_admin', 'social_worker'])
);
drop policy if exists "residents_insert_self_or_admin" on public.residents;
create policy "residents_insert_self_or_admin" on public.residents for insert with check (
  profile_id = auth.uid() or public.has_role(array['admin', 'super_admin', 'social_worker'])
);
drop policy if exists "residents_update_own_or_admin" on public.residents;
create policy "residents_update_own_or_admin" on public.residents for update using (
  profile_id = auth.uid() or public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  profile_id = auth.uid() or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "assistance_types_public_select" on public.assistance_types;
create policy "assistance_types_public_select" on public.assistance_types for select using (is_active = true);
drop policy if exists "assistance_types_admin_manage" on public.assistance_types;
create policy "assistance_types_admin_manage" on public.assistance_types for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "assistance_requirements_public_select" on public.assistance_requirements;
create policy "assistance_requirements_public_select" on public.assistance_requirements for select using (
  exists (
    select 1
    from public.assistance_types at
    where at.id = assistance_type_id
      and at.is_active = true
  )
);
drop policy if exists "assistance_requirements_admin_manage" on public.assistance_requirements;
create policy "assistance_requirements_admin_manage" on public.assistance_requirements for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "applications_select_own_or_admin" on public.applications;
create policy "applications_select_own_or_admin" on public.applications for select using (
  applicant_profile_id = auth.uid()
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);
drop policy if exists "applications_insert_authenticated" on public.applications;
create policy "applications_insert_authenticated" on public.applications for insert with check (
  auth.uid() = applicant_profile_id and consent_accepted = true
);
drop policy if exists "applications_update_admin_or_owner_pending" on public.applications;
create policy "applications_update_admin_or_owner_pending" on public.applications for update using (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
  or (applicant_profile_id = auth.uid() and status in ('draft', 'pending_verification', 'for_correction'))
) with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
  or (applicant_profile_id = auth.uid() and status in ('draft', 'pending_verification', 'for_correction'))
);

drop policy if exists "application_requirements_select_own_or_admin" on public.application_requirements;
create policy "application_requirements_select_own_or_admin" on public.application_requirements for select using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and (a.applicant_profile_id = auth.uid() or public.has_role(array['admin', 'super_admin', 'social_worker']))
  )
);
drop policy if exists "application_requirements_admin_manage" on public.application_requirements;
create policy "application_requirements_admin_manage" on public.application_requirements for all using (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "uploaded_documents_select_own_or_admin" on public.uploaded_documents;
create policy "uploaded_documents_select_own_or_admin" on public.uploaded_documents for select using (
  uploaded_by = auth.uid()
  or exists (
    select 1
    from public.applications a
    where a.id = application_id
      and (a.applicant_profile_id = auth.uid() or public.has_role(array['admin', 'super_admin', 'social_worker']))
  )
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);
drop policy if exists "uploaded_documents_insert_authenticated" on public.uploaded_documents;
create policy "uploaded_documents_insert_authenticated" on public.uploaded_documents for insert with check (
  uploaded_by = auth.uid() or public.has_role(array['admin', 'super_admin', 'social_worker'])
);
drop policy if exists "uploaded_documents_update_admin" on public.uploaded_documents;
create policy "uploaded_documents_update_admin" on public.uploaded_documents for update using (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "verification_logs_admin_only" on public.verification_logs;
create policy "verification_logs_admin_only" on public.verification_logs for all using (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "status_histories_select_own_or_admin" on public.status_histories;
create policy "status_histories_select_own_or_admin" on public.status_histories for select using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and (a.applicant_profile_id = auth.uid() or public.has_role(array['admin', 'super_admin', 'social_worker']))
  )
);
drop policy if exists "status_histories_insert_admin" on public.status_histories;
create policy "status_histories_insert_admin" on public.status_histories for insert with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select using (
  recipient_id = auth.uid() or public.has_role(array['admin', 'super_admin'])
);
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update using (
  recipient_id = auth.uid()
) with check (
  recipient_id = auth.uid()
);
drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert" on public.notifications for insert with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "announcements_public_select" on public.announcements;
create policy "announcements_public_select" on public.announcements for select using (is_published = true);
drop policy if exists "announcements_admin_manage" on public.announcements;
create policy "announcements_admin_manage" on public.announcements for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "faqs_public_select" on public.faqs;
create policy "faqs_public_select" on public.faqs for select using (is_published = true);
drop policy if exists "faqs_admin_manage" on public.faqs;
create policy "faqs_admin_manage" on public.faqs for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "audit_logs_admin_only" on public.audit_logs;
create policy "audit_logs_admin_only" on public.audit_logs for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);
drop policy if exists "email_logs_admin_only" on public.email_logs;
create policy "email_logs_admin_only" on public.email_logs for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);
drop policy if exists "staff_assignments_admin_only" on public.staff_assignments;
create policy "staff_assignments_admin_only" on public.staff_assignments for all using (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
);
drop policy if exists "settings_admin_only" on public.settings;
create policy "settings_admin_only" on public.settings for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "storage_resident_objects_select" on storage.objects;
create policy "storage_resident_objects_select" on storage.objects for select using (
  (
    bucket_id in ('resident-documents', 'application-documents', 'ids')
    and (split_part(name, '/', 1) = auth.uid()::text or public.has_role(array['admin', 'super_admin', 'social_worker']))
  )
  or (bucket_id = 'requirements' and auth.role() = 'authenticated')
);
drop policy if exists "storage_resident_objects_insert" on storage.objects;
create policy "storage_resident_objects_insert" on storage.objects for insert with check (
  (
    bucket_id in ('resident-documents', 'application-documents', 'ids')
    and split_part(name, '/', 1) = auth.uid()::text
  )
  or (bucket_id = 'requirements' and public.has_role(array['admin', 'super_admin']))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);
drop policy if exists "storage_resident_objects_update" on storage.objects;
create policy "storage_resident_objects_update" on storage.objects for update using (
  (
    bucket_id in ('resident-documents', 'application-documents', 'ids')
    and split_part(name, '/', 1) = auth.uid()::text
  )
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  (
    bucket_id in ('resident-documents', 'application-documents', 'ids')
    and split_part(name, '/', 1) = auth.uid()::text
  )
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);
drop policy if exists "storage_resident_objects_delete" on storage.objects;
create policy "storage_resident_objects_delete" on storage.objects for delete using (
  (
    bucket_id in ('resident-documents', 'application-documents', 'ids')
    and split_part(name, '/', 1) = auth.uid()::text
  )
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);
