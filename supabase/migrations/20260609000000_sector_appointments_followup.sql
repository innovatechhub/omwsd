-- Allow verified residents to book multiple follow-up appointments
-- after their sector registration is verified.

-- ─────────────────────────────────────────────────────────────
-- 1. Drop the one-appointment-per-registration unique constraint
--    so verified residents can book multiple follow-up slots.
-- ─────────────────────────────────────────────────────────────

alter table public.appointments
  drop constraint if exists appointments_sector_registration_id_key;

-- ─────────────────────────────────────────────────────────────
-- 2. Index for resident appointment lookups by profile
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_appointments_profile_id
  on public.appointments (profile_id);
