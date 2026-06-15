-- Add for_interview to applications status check constraint
alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check check (
    status in (
      'draft',
      'pending_verification',
      'for_requirements',
      'for_correction',
      'for_interview',
      'approved',
      'rejected'
    )
  );
