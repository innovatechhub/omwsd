-- Enforce admin approval before resident accounts can use portal features.

create or replace function public.is_active_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.is_active = true
  );
$$;

create or replace function public.can_update_own_profile(
  target_user_id uuid,
  next_role text,
  next_is_active boolean
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.id = target_user_id
      and p.is_active = true
      and p.role = next_role
      and p.is_active = next_is_active
  );
$$;

create or replace function public.has_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      join public.profiles p on p.id = ur.user_id
      where ur.user_id = auth.uid()
        and p.is_active = true
        and r.code = any(required_roles)
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.is_active = true
        and p.role = any(required_roles)
    );
$$;

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
with check (
  public.has_role(array['admin', 'super_admin'])
  or (
    auth.uid() = id
    and role = 'resident'
    and is_active = false
  )
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (
  auth.uid() = id
  or public.has_role(array['admin', 'super_admin'])
)
with check (
  public.has_role(array['admin', 'super_admin'])
  or public.can_update_own_profile(id, role, is_active)
);

drop policy if exists "residents_select_own_or_admin" on public.residents;
create policy "residents_select_own_or_admin" on public.residents for select using (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "residents_insert_self_or_admin" on public.residents;
create policy "residents_insert_self_or_admin" on public.residents for insert with check (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "residents_update_own_or_admin" on public.residents;
create policy "residents_update_own_or_admin" on public.residents for update using (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "applications_select_own_or_admin" on public.applications;
create policy "applications_select_own_or_admin" on public.applications for select using (
  (applicant_profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "applications_insert_authenticated" on public.applications;
create policy "applications_insert_authenticated" on public.applications for insert with check (
  auth.uid() = applicant_profile_id
  and consent_accepted = true
  and public.is_active_profile(auth.uid())
);

drop policy if exists "applications_update_admin_or_owner_pending" on public.applications;
create policy "applications_update_admin_or_owner_pending" on public.applications for update using (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
  or (
    applicant_profile_id = auth.uid()
    and public.is_active_profile(auth.uid())
    and status in ('draft', 'pending_verification', 'for_correction')
  )
) with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
  or (
    applicant_profile_id = auth.uid()
    and public.is_active_profile(auth.uid())
    and status in ('draft', 'pending_verification', 'for_correction')
  )
);

drop policy if exists "application_requirements_select_own_or_admin" on public.application_requirements;
create policy "application_requirements_select_own_or_admin" on public.application_requirements for select using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and (
        (a.applicant_profile_id = auth.uid() and public.is_active_profile(auth.uid()))
        or public.has_role(array['admin', 'super_admin', 'social_worker'])
      )
  )
);

drop policy if exists "uploaded_documents_select_own_or_admin" on public.uploaded_documents;
create policy "uploaded_documents_select_own_or_admin" on public.uploaded_documents for select using (
  (uploaded_by = auth.uid() and public.is_active_profile(auth.uid()))
  or exists (
    select 1
    from public.applications a
    where a.id = application_id
      and (
        (a.applicant_profile_id = auth.uid() and public.is_active_profile(auth.uid()))
        or public.has_role(array['admin', 'super_admin', 'social_worker'])
      )
  )
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "uploaded_documents_insert_authenticated" on public.uploaded_documents;
create policy "uploaded_documents_insert_authenticated" on public.uploaded_documents for insert with check (
  (
    uploaded_by = auth.uid()
    and (
      bucket = 'ids'
      or public.is_active_profile(auth.uid())
    )
  )
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "status_histories_select_own_or_admin" on public.status_histories;
create policy "status_histories_select_own_or_admin" on public.status_histories for select using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and (
        (a.applicant_profile_id = auth.uid() and public.is_active_profile(auth.uid()))
        or public.has_role(array['admin', 'super_admin', 'social_worker'])
      )
  )
);

drop policy if exists "status_histories_insert_initial_or_admin" on public.status_histories;
create policy "status_histories_insert_initial_or_admin"
on public.status_histories
for insert
with check (
  public.has_role(array['admin', 'super_admin', 'social_worker'])
  or (
    changed_by = auth.uid()
    and public.is_active_profile(auth.uid())
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

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select using (
  (recipient_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update using (
  recipient_id = auth.uid()
  and public.is_active_profile(auth.uid())
) with check (
  recipient_id = auth.uid()
  and public.is_active_profile(auth.uid())
);

drop policy if exists "storage_resident_objects_select" on storage.objects;
create policy "storage_resident_objects_select" on storage.objects for select using (
  (
    bucket_id in ('resident-documents', 'application-documents', 'ids')
    and (
      (split_part(name, '/', 1) = auth.uid()::text and public.is_active_profile(auth.uid()))
      or public.has_role(array['admin', 'super_admin', 'social_worker'])
    )
  )
  or (bucket_id = 'requirements' and auth.role() = 'authenticated')
);

drop policy if exists "storage_resident_objects_insert" on storage.objects;
create policy "storage_resident_objects_insert" on storage.objects for insert with check (
  (
    bucket_id = 'ids'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  or (
    bucket_id in ('resident-documents', 'application-documents')
    and split_part(name, '/', 1) = auth.uid()::text
    and public.is_active_profile(auth.uid())
  )
  or (bucket_id = 'requirements' and public.has_role(array['admin', 'super_admin']))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "storage_resident_objects_update" on storage.objects;
create policy "storage_resident_objects_update" on storage.objects for update using (
  (
    bucket_id in ('resident-documents', 'application-documents', 'ids')
    and split_part(name, '/', 1) = auth.uid()::text
    and public.is_active_profile(auth.uid())
  )
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  (
    bucket_id in ('resident-documents', 'application-documents', 'ids')
    and split_part(name, '/', 1) = auth.uid()::text
    and public.is_active_profile(auth.uid())
  )
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "storage_resident_objects_delete" on storage.objects;
create policy "storage_resident_objects_delete" on storage.objects for delete using (
  (
    bucket_id in ('resident-documents', 'application-documents', 'ids')
    and split_part(name, '/', 1) = auth.uid()::text
    and public.is_active_profile(auth.uid())
  )
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "sector_reg_select" on public.sector_registrations;
create policy "sector_reg_select" on public.sector_registrations for select using (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "sector_reg_insert" on public.sector_registrations;
create policy "sector_reg_insert" on public.sector_registrations for insert with check (
  profile_id = auth.uid()
  and public.is_active_profile(auth.uid())
);

drop policy if exists "sector_reg_update" on public.sector_registrations;
create policy "sector_reg_update" on public.sector_registrations for update using (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select" on public.appointments for select using (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "appointments_insert" on public.appointments;
create policy "appointments_insert" on public.appointments for insert with check (
  profile_id = auth.uid()
  and public.is_active_profile(auth.uid())
);

drop policy if exists "appointments_update" on public.appointments;
create policy "appointments_update" on public.appointments for update using (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  (profile_id = auth.uid() and public.is_active_profile(auth.uid()))
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "sector_docs_select" on storage.objects;
create policy "sector_docs_select" on storage.objects for select using (
  bucket_id = 'sector-documents'
  and (
    (split_part(name, '/', 1) = auth.uid()::text and public.is_active_profile(auth.uid()))
    or public.has_role(array['admin', 'super_admin', 'social_worker'])
  )
);

drop policy if exists "sector_docs_insert" on storage.objects;
create policy "sector_docs_insert" on storage.objects for insert with check (
  bucket_id = 'sector-documents'
  and split_part(name, '/', 1) = auth.uid()::text
  and public.is_active_profile(auth.uid())
);

drop policy if exists "sector_docs_update" on storage.objects;
create policy "sector_docs_update" on storage.objects for update using (
  bucket_id = 'sector-documents'
  and (
    (split_part(name, '/', 1) = auth.uid()::text and public.is_active_profile(auth.uid()))
    or public.has_role(array['admin', 'super_admin', 'social_worker'])
  )
) with check (
  bucket_id = 'sector-documents'
  and (
    (split_part(name, '/', 1) = auth.uid()::text and public.is_active_profile(auth.uid()))
    or public.has_role(array['admin', 'super_admin', 'social_worker'])
  )
);

drop policy if exists "sector_docs_delete" on storage.objects;
create policy "sector_docs_delete" on storage.objects for delete using (
  bucket_id = 'sector-documents'
  and (
    (split_part(name, '/', 1) = auth.uid()::text and public.is_active_profile(auth.uid()))
    or public.has_role(array['admin', 'super_admin', 'social_worker'])
  )
);
