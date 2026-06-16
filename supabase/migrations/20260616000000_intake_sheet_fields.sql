-- Add OMSWD General Intake Sheet fields to applications table
alter table public.applications
  add column if not exists educational_attainment text,
  add column if not exists occupation text,
  add column if not exists relationship_to_beneficiary text,
  add column if not exists family_composition jsonb not null default '[]'::jsonb;
