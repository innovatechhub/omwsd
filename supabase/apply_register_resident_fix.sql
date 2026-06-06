-- Run this file instead of rerunning complete_setup.sql on an existing database.
-- If Supabase reports a deadlock, wait a few seconds and rerun only the failed
-- section. Deadlocks roll back the failed transaction.

alter table public.residents
  add column if not exists government_id_type text,
  add column if not exists government_id_number text;

-- 1) Replace the signup trigger function. This does not drop the auth trigger.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  metadata jsonb;
  resident_first_name text;
  resident_middle_name text;
  resident_last_name text;
  resident_suffix text;
  resident_full_name text;
  resident_municipality text;
  resident_barangay text;
  municipality_record_id uuid;
  barangay_record_id uuid;
begin
  metadata := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role := coalesce(metadata ->> 'role', 'resident');
  resident_full_name := nullif(metadata ->> 'full_name', '');
  resident_first_name := nullif(metadata ->> 'first_name', '');
  resident_middle_name := nullif(metadata ->> 'middle_name', '');
  resident_last_name := nullif(metadata ->> 'last_name', '');
  resident_suffix := nullif(metadata ->> 'suffix', '');
  resident_municipality := nullif(metadata ->> 'municipality', '');
  resident_barangay := nullif(metadata ->> 'barangay', '');

  if resident_first_name is null and resident_full_name is not null then
    resident_first_name := split_part(resident_full_name, ' ', 1);
  end if;

  if resident_last_name is null then
    resident_last_name := coalesce(resident_full_name, resident_first_name, 'Resident');
  end if;

  select m.id
  into municipality_record_id
  from public.municipalities m
  where lower(m.name) = lower(coalesce(resident_municipality, 'Pandan'))
  order by m.name
  limit 1;

  select b.id
  into barangay_record_id
  from public.barangays b
  where lower(b.name) = lower(coalesce(resident_barangay, ''))
    and (
      municipality_record_id is null
      or b.municipality_id = municipality_record_id
    )
  order by b.name
  limit 1;

  insert into public.profiles (
    id,
    email,
    full_name,
    phone_number,
    role,
    barangay,
    municipality,
    is_active
  )
  values (
    new.id,
    new.email,
    resident_full_name,
    metadata ->> 'phone_number',
    requested_role,
    resident_barangay,
    resident_municipality,
    coalesce((metadata ->> 'is_active')::boolean, true)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone_number = coalesce(excluded.phone_number, public.profiles.phone_number),
    role = coalesce(excluded.role, public.profiles.role),
    barangay = coalesce(excluded.barangay, public.profiles.barangay),
    municipality = coalesce(excluded.municipality, public.profiles.municipality),
    is_active = excluded.is_active;

  if requested_role = 'resident' then
    insert into public.residents (
      profile_id,
      resident_code,
      first_name,
      middle_name,
      last_name,
      suffix,
      birth_date,
      sex,
      civil_status,
      contact_number,
      address_line,
      barangay_id,
      municipality_id,
      government_id_type,
      government_id_number
    )
    values (
      new.id,
      'RES-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)),
      coalesce(resident_first_name, 'Resident'),
      resident_middle_name,
      coalesce(resident_last_name, 'Resident'),
      resident_suffix,
      nullif(metadata ->> 'birth_date', '')::date,
      nullif(metadata ->> 'sex', ''),
      nullif(metadata ->> 'civil_status', ''),
      nullif(metadata ->> 'phone_number', ''),
      nullif(metadata ->> 'address_line', ''),
      barangay_record_id,
      municipality_record_id,
      nullif(metadata ->> 'government_id_type', ''),
      nullif(metadata ->> 'government_id_number', '')
    )
    on conflict (profile_id) do update
    set
      first_name = excluded.first_name,
      middle_name = excluded.middle_name,
      last_name = excluded.last_name,
      suffix = excluded.suffix,
      birth_date = excluded.birth_date,
      sex = excluded.sex,
      civil_status = excluded.civil_status,
      contact_number = excluded.contact_number,
      address_line = excluded.address_line,
      barangay_id = excluded.barangay_id,
      municipality_id = excluded.municipality_id,
      government_id_type = excluded.government_id_type,
      government_id_number = excluded.government_id_number;
  end if;

  insert into public.user_roles (user_id, role_id)
  select new.id, r.id
  from public.roles r
  where r.code = requested_role
  on conflict (user_id, role_id) do nothing;

  return new;
end;
$$;

-- 2) Only create the trigger if it is missing.
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end;
$$;

-- 3) Backfill profiles for resident accounts already created in Supabase Auth.
with auth_profile_rows as (
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data, '{}'::jsonb) as metadata
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.raw_user_meta_data ->> 'role' = 'resident'
     or p.role = 'resident'
)
insert into public.profiles (
  id,
  email,
  full_name,
  phone_number,
  role,
  barangay,
  municipality,
  is_active
)
select
  id,
  email,
  nullif(metadata ->> 'full_name', ''),
  nullif(metadata ->> 'phone_number', ''),
  'resident',
  nullif(metadata ->> 'barangay', ''),
  nullif(metadata ->> 'municipality', ''),
  coalesce((metadata ->> 'is_active')::boolean, true)
from auth_profile_rows
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  phone_number = coalesce(excluded.phone_number, public.profiles.phone_number),
  role = coalesce(excluded.role, public.profiles.role),
  barangay = coalesce(excluded.barangay, public.profiles.barangay),
  municipality = coalesce(excluded.municipality, public.profiles.municipality),
  is_active = excluded.is_active;

-- 4) Backfill residents for resident accounts already created in Supabase Auth.
with auth_resident_rows as (
  select
    u.id,
    coalesce(u.raw_user_meta_data, '{}'::jsonb) as metadata
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.raw_user_meta_data ->> 'role' = 'resident'
     or p.role = 'resident'
),
resolved_resident_rows as (
  select distinct on (ar.id)
    ar.id,
    ar.metadata,
    nullif(ar.metadata ->> 'full_name', '') as full_name,
    nullif(ar.metadata ->> 'first_name', '') as first_name,
    nullif(ar.metadata ->> 'middle_name', '') as middle_name,
    nullif(ar.metadata ->> 'last_name', '') as last_name,
    nullif(ar.metadata ->> 'suffix', '') as suffix,
    m.id as municipality_id,
    b.id as barangay_id
  from auth_resident_rows ar
  left join public.municipalities m
    on lower(m.name) = lower(coalesce(nullif(ar.metadata ->> 'municipality', ''), 'Pandan'))
  left join public.barangays b
    on lower(b.name) = lower(coalesce(nullif(ar.metadata ->> 'barangay', ''), ''))
   and (m.id is null or b.municipality_id = m.id)
  order by ar.id, b.name
)
insert into public.residents (
  profile_id,
  resident_code,
  first_name,
  middle_name,
  last_name,
  suffix,
  birth_date,
  sex,
  civil_status,
  contact_number,
  address_line,
  barangay_id,
  municipality_id,
  government_id_type,
  government_id_number
)
select
  id,
  'RES-' || upper(substr(replace(id::text, '-', ''), 1, 8)),
  coalesce(first_name, split_part(full_name, ' ', 1), 'Resident'),
  middle_name,
  coalesce(last_name, full_name, first_name, 'Resident'),
  suffix,
  nullif(metadata ->> 'birth_date', '')::date,
  nullif(metadata ->> 'sex', ''),
  nullif(metadata ->> 'civil_status', ''),
  nullif(metadata ->> 'phone_number', ''),
  nullif(metadata ->> 'address_line', ''),
  barangay_id,
  municipality_id,
  nullif(metadata ->> 'government_id_type', ''),
  nullif(metadata ->> 'government_id_number', '')
from resolved_resident_rows
on conflict (profile_id) do update
set
  first_name = excluded.first_name,
  middle_name = excluded.middle_name,
  last_name = excluded.last_name,
  suffix = excluded.suffix,
  birth_date = excluded.birth_date,
  sex = excluded.sex,
  civil_status = excluded.civil_status,
  contact_number = excluded.contact_number,
  address_line = excluded.address_line,
  barangay_id = excluded.barangay_id,
  municipality_id = excluded.municipality_id,
  government_id_type = excluded.government_id_type,
  government_id_number = excluded.government_id_number;
