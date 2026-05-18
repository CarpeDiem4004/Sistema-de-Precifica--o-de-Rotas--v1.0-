begin;

alter table if exists public.system_admins
  add column if not exists email text;

alter table if exists public.system_admins
  add column if not exists ativo boolean not null default true;

alter table if exists public.system_admins
  add column if not exists criado_em timestamptz not null default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'system_admins'
      and column_name = 'email'
  ) then
    update public.system_admins sa
    set email = u.email
    from auth.users u
    where sa.user_id = u.id
      and sa.email is null;
  end if;
end;
$$;

create unique index if not exists idx_system_admins_email_unique
  on public.system_admins (lower(email))
  where email is not null;

insert into public.system_admins (user_id, email)
select id, email
from auth.users
where lower(email) = 'carpediem4004@outlook.com'
on conflict (user_id) do update set
  email = excluded.email,
  ativo = true;

commit;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'system_admins'
order by ordinal_position;

select user_id, email, ativo, criado_em
from public.system_admins
where lower(email) = 'carpediem4004@outlook.com';
