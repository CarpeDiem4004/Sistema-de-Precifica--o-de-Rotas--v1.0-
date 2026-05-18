-- Seed do admin global
-- Email alvo: carpediem4004@outlook.com
-- Requisito: este email ja precisa existir em auth.users

insert into public.system_admins (user_id, email)
select id, email
from auth.users
where lower(email) = 'carpediem4004@outlook.com'
on conflict (user_id) do update set
  email = excluded.email,
  ativo = true;

select user_id, email, ativo, criado_em
from public.system_admins
where lower(email) = 'carpediem4004@outlook.com';
