-- Sector registrations: PWD, Senior Citizen, Solo Parent
-- Run after complete_setup.sql / apply_register_resident_fix.sql

-- ─────────────────────────────────────────────────────────────
-- 1. Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists public.sector_registrations (
  id                    uuid primary key default gen_random_uuid(),
  resident_id           uuid not null references public.residents(id) on delete cascade,
  profile_id            uuid not null references public.profiles(id) on delete cascade,
  sector_type           text not null check (sector_type in ('pwd', 'senior_citizen', 'solo_parent')),
  status                text not null default 'pending_appointment' check (
    status in (
      'pending_appointment',
      'appointment_booked',
      'document_uploaded',
      'under_review',
      'verified',
      'rejected'
    )
  ),
  sector_id_type        text,
  sector_id_number      text,
  document_bucket       text,
  document_file_path    text,
  document_file_name    text,
  document_mime_type    text,
  document_size_bytes   bigint,
  document_uploaded_at  timestamptz,
  appointment_id        uuid,
  admin_remarks         text,
  reviewed_by           uuid references auth.users(id) on delete set null,
  reviewed_at           timestamptz,
  verified_at           timestamptz,
  created_at            timestamptz not null default timezone('utc', now()),
  updated_at            timestamptz not null default timezone('utc', now()),
  unique (resident_id, sector_type)
);

create table if not exists public.appointment_slots (
  id            uuid primary key default gen_random_uuid(),
  slot_date     date not null,
  slot_time     time not null,
  slot_label    text not null,
  sector_type   text check (sector_type in ('pwd', 'senior_citizen', 'solo_parent')),
  max_capacity  integer not null default 5,
  booked_count  integer not null default 0,
  is_active     boolean not null default true,
  notes         text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now()),
  unique (slot_date, slot_time, coalesce(sector_type, ''))
);

create table if not exists public.appointments (
  id                        uuid primary key default gen_random_uuid(),
  sector_registration_id    uuid not null references public.sector_registrations(id) on delete cascade,
  resident_id               uuid not null references public.residents(id) on delete cascade,
  profile_id                uuid not null references public.profiles(id) on delete cascade,
  slot_id                   uuid not null references public.appointment_slots(id) on delete restrict,
  status                    text not null default 'booked' check (
    status in ('booked', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  notes                     text,
  confirmed_at              timestamptz,
  completed_at              timestamptz,
  cancelled_at              timestamptz,
  created_at                timestamptz not null default timezone('utc', now()),
  updated_at                timestamptz not null default timezone('utc', now()),
  unique (sector_registration_id)
);

-- Back-link sector_registrations → appointments
alter table public.sector_registrations
  add constraint fk_sector_registration_appointment
  foreign key (appointment_id) references public.appointments(id) on delete set null
  not valid;

-- ─────────────────────────────────────────────────────────────
-- 2. Indexes
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_sector_registrations_resident_id  on public.sector_registrations(resident_id);
create index if not exists idx_sector_registrations_profile_id   on public.sector_registrations(profile_id);
create index if not exists idx_sector_registrations_status       on public.sector_registrations(status);
create index if not exists idx_sector_registrations_sector_type  on public.sector_registrations(sector_type);
create index if not exists idx_appointments_slot_id              on public.appointments(slot_id);
create index if not exists idx_appointments_resident_id          on public.appointments(resident_id);
create index if not exists idx_appointment_slots_slot_date       on public.appointment_slots(slot_date);

-- ─────────────────────────────────────────────────────────────
-- 3. updated_at triggers
-- ─────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_sector_registrations_updated_at on public.sector_registrations;
create trigger set_sector_registrations_updated_at
  before update on public.sector_registrations
  for each row execute function public.set_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

drop trigger if exists set_appointment_slots_updated_at on public.appointment_slots;
create trigger set_appointment_slots_updated_at
  before update on public.appointment_slots
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4. Auto booked_count trigger
-- ─────────────────────────────────────────────────────────────

create or replace function public.update_slot_booked_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' and new.status = 'booked' then
    update public.appointment_slots
    set booked_count = booked_count + 1
    where id = new.slot_id;
  elsif TG_OP = 'UPDATE' then
    if old.status != 'cancelled' and new.status = 'cancelled' then
      update public.appointment_slots
      set booked_count = greatest(booked_count - 1, 0)
      where id = new.slot_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists update_slot_count_on_appointment on public.appointments;
create trigger update_slot_count_on_appointment
  after insert or update on public.appointments
  for each row execute function public.update_slot_booked_count();

-- ─────────────────────────────────────────────────────────────
-- 5. RLS
-- ─────────────────────────────────────────────────────────────

alter table public.sector_registrations  enable row level security;
alter table public.appointments          enable row level security;
alter table public.appointment_slots     enable row level security;

-- sector_registrations
drop policy if exists "sector_reg_select"  on public.sector_registrations;
create policy "sector_reg_select" on public.sector_registrations for select using (
  profile_id = auth.uid()
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "sector_reg_insert" on public.sector_registrations;
create policy "sector_reg_insert" on public.sector_registrations for insert with check (
  profile_id = auth.uid()
);

drop policy if exists "sector_reg_update" on public.sector_registrations;
create policy "sector_reg_update" on public.sector_registrations for update using (
  profile_id = auth.uid()
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  profile_id = auth.uid()
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

-- appointments
drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select" on public.appointments for select using (
  profile_id = auth.uid()
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

drop policy if exists "appointments_insert" on public.appointments;
create policy "appointments_insert" on public.appointments for insert with check (
  profile_id = auth.uid()
);

drop policy if exists "appointments_update" on public.appointments;
create policy "appointments_update" on public.appointments for update using (
  profile_id = auth.uid()
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
) with check (
  profile_id = auth.uid()
  or public.has_role(array['admin', 'super_admin', 'social_worker'])
);

-- appointment_slots: any authenticated user can read; only admins can write
drop policy if exists "slots_select" on public.appointment_slots;
create policy "slots_select" on public.appointment_slots for select using (
  auth.role() = 'authenticated'
);

drop policy if exists "slots_admin_all" on public.appointment_slots;
create policy "slots_admin_all" on public.appointment_slots for all using (
  public.has_role(array['admin', 'super_admin'])
) with check (
  public.has_role(array['admin', 'super_admin'])
);

-- ─────────────────────────────────────────────────────────────
-- 6. Storage bucket: sector-documents
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('sector-documents', 'sector-documents', false)
on conflict (id) do nothing;

drop policy if exists "sector_docs_select" on storage.objects;
create policy "sector_docs_select" on storage.objects for select using (
  bucket_id = 'sector-documents'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.has_role(array['admin', 'super_admin', 'social_worker'])
  )
);

drop policy if exists "sector_docs_insert" on storage.objects;
create policy "sector_docs_insert" on storage.objects for insert with check (
  bucket_id = 'sector-documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "sector_docs_update" on storage.objects;
create policy "sector_docs_update" on storage.objects for update using (
  bucket_id = 'sector-documents'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.has_role(array['admin', 'super_admin', 'social_worker'])
  )
) with check (
  bucket_id = 'sector-documents'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.has_role(array['admin', 'super_admin', 'social_worker'])
  )
);

drop policy if exists "sector_docs_delete" on storage.objects;
create policy "sector_docs_delete" on storage.objects for delete using (
  bucket_id = 'sector-documents'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.has_role(array['admin', 'super_admin', 'social_worker'])
  )
);
