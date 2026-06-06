-- Restores admin@gmail.com if it was accidentally classified as a resident.
-- Run this in Supabase SQL Editor, then sign out and sign in again.

update public.profiles
set
  role = 'admin',
  is_active = true
where lower(email) = 'admin@gmail.com';

update auth.users
set raw_user_meta_data =
  jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb,
    true
  )
where lower(email) = 'admin@gmail.com';

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u
join public.roles r on r.code = 'admin'
where lower(u.email) = 'admin@gmail.com'
on conflict (user_id, role_id) do nothing;

delete from public.user_roles ur
using auth.users u, public.roles r
where ur.user_id = u.id
  and ur.role_id = r.id
  and lower(u.email) = 'admin@gmail.com'
  and r.code = 'resident';

delete from public.residents res
using public.profiles p
where res.profile_id = p.id
  and lower(p.email) = 'admin@gmail.com';
