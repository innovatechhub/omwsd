-- Add pending_review status to sector_registrations
-- Residents now start in pending_review; admin must approve before they can book an appointment.

alter table public.sector_registrations
  drop constraint if exists sector_registrations_status_check;

alter table public.sector_registrations
  add constraint sector_registrations_status_check
  check (status in (
    'pending_review',
    'pending_appointment',
    'appointment_booked',
    'document_uploaded',
    'under_review',
    'verified',
    'rejected'
  ));

alter table public.sector_registrations
  alter column status set default 'pending_review';
