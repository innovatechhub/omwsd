-- Allow active residents to update editable profile fields without changing protected fields.

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
      and p.role is not distinct from next_role
      and p.is_active is not distinct from next_is_active
  );
$$;
