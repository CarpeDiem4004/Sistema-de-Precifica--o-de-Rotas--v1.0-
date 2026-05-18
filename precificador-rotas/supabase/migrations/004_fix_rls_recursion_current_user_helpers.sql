begin;

create or replace function public.current_empresa_id()
returns uuid
language plpgsql
security definer
stable
set search_path = public, auth
as $$
declare
  v_empresa_id uuid;
begin
  select u.empresa_id
  into v_empresa_id
  from public.usuarios u
  where u.auth_user_id = auth.uid()
  limit 1;

  return v_empresa_id;
end;
$$;

create or replace function public.current_user_role()
returns text
language plpgsql
security definer
stable
set search_path = public, auth
as $$
declare
  v_role text;
begin
  select u.cargo
  into v_role
  from public.usuarios u
  where u.auth_user_id = auth.uid()
  limit 1;

  return v_role;
end;
$$;

create or replace function public.is_empresa_slug_available(p_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return not exists (
    select 1
    from public.empresas
    where slug = lower(trim(p_slug))
  );
end;
$$;

commit;
