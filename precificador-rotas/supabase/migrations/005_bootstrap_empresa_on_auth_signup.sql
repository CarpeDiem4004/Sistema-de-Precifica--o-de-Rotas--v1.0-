begin;

create or replace function public.handle_auth_user_bootstrap_empresa()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_nome text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'nome', '')), '');
  v_empresa_nome text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'empresa_nome', '')), '');
  v_empresa_slug text := lower(nullif(trim(coalesce(new.raw_user_meta_data ->> 'empresa_slug', '')), ''));
  v_cnpj text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'cnpj', '')), '');
  v_telefone text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'telefone', '')), '');
  v_convite_token text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'convite_token', '')), '');
  v_empresa_id uuid;
begin
  if v_convite_token is not null then
    return new;
  end if;

  if v_nome is null or v_empresa_nome is null or v_empresa_slug is null then
    return new;
  end if;

  if exists (select 1 from public.usuarios where auth_user_id = new.id) then
    return new;
  end if;

  insert into public.empresas (
    slug,
    nome_fantasia,
    razao_social,
    cnpj,
    email_contato,
    telefone,
    plano,
    status,
    data_expiracao
  )
  values (
    v_empresa_slug,
    v_empresa_nome,
    v_empresa_nome,
    v_cnpj,
    coalesce(new.email, ''),
    v_telefone,
    'trial',
    'ativo',
    timezone('utc', now()) + interval '30 days'
  )
  on conflict (slug) do nothing
  returning id into v_empresa_id;

  if v_empresa_id is null then
    return new;
  end if;

  insert into public.usuarios (
    auth_user_id,
    empresa_id,
    nome,
    email,
    cargo,
    status,
    ultimo_acesso
  )
  values (
    new.id,
    v_empresa_id,
    v_nome,
    coalesce(new.email, ''),
    'admin',
    'ativo',
    timezone('utc', now())
  )
  on conflict (auth_user_id) do nothing;

  insert into public.custos_globais (
    empresa_id,
    preco_diesel_litro,
    custo_motorista_km,
    pedagio_medio_km,
    data_atualizacao
  )
  values (
    v_empresa_id,
    5.89,
    0.85,
    0.32,
    timezone('utc', now())
  )
  on conflict (empresa_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_bootstrap_empresa on auth.users;
create trigger on_auth_user_created_bootstrap_empresa
after insert on auth.users
for each row
execute function public.handle_auth_user_bootstrap_empresa();

commit;
