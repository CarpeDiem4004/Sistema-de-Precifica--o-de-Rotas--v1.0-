create extension if not exists pgcrypto;

create or replace function public.migrate_single_tenant_to_empresa(
  p_empresa_slug text,
  p_empresa_nome text,
  p_admin_auth_user_id uuid,
  p_admin_nome text,
  p_admin_email text,
  p_cnpj text default null,
  p_telefone text default null
)
returns table (empresa_id uuid, usuario_id uuid, bases_migradas bigint, operacoes_migradas bigint)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_empresa_id uuid;
  v_usuario_id uuid;
  v_bases_count bigint := 0;
  v_operacoes_count bigint := 0;
  v_operacoes_sql text;
  v_custos_sql text;
begin
  if nullif(trim(coalesce(p_empresa_slug, '')), '') is null then
    raise exception 'Slug da empresa é obrigatório';
  end if;

  if p_admin_auth_user_id is null then
    raise exception 'Auth user id do administrador é obrigatório';
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
    lower(trim(p_empresa_slug)),
    p_empresa_nome,
    p_empresa_nome,
    nullif(trim(coalesce(p_cnpj, '')), ''),
    p_admin_email,
    nullif(trim(coalesce(p_telefone, '')), ''),
    'trial',
    'ativo',
    timezone('utc', now()) + interval '30 days'
  )
  on conflict (slug)
  do update set
    nome_fantasia = excluded.nome_fantasia,
    razao_social = excluded.razao_social,
    email_contato = excluded.email_contato,
    telefone = excluded.telefone
  returning id into v_empresa_id;

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
    p_admin_auth_user_id,
    v_empresa_id,
    p_admin_nome,
    p_admin_email,
    'admin',
    'ativo',
    timezone('utc', now())
  )
  on conflict (auth_user_id)
  do update set
    empresa_id = excluded.empresa_id,
    nome = excluded.nome,
    email = excluded.email,
    cargo = 'admin',
    status = 'ativo'
  returning id into v_usuario_id;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bases' and column_name = 'empresa_id'
  ) then
    update public.bases
    set empresa_id = v_empresa_id
    where empresa_id is null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'operacoes' and column_name = 'empresa_id'
  ) then
    v_operacoes_sql := 'update public.operacoes set '
      || 'empresa_id = coalesce(empresa_id, $1), '
      || 'usuario_id = coalesce(usuario_id, $2), '
      || 'criado_por = coalesce(nullif(criado_por, ''''), $3), '
      || 'editado_por = coalesce(editado_por, $3), '
      || 'criado_em = coalesce(criado_em';

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'operacoes' and column_name = 'created_at'
    ) then
      v_operacoes_sql := v_operacoes_sql || ', created_at';
    end if;

    v_operacoes_sql := v_operacoes_sql || ', timezone(''utc'', now())), atualizado_em = coalesce(atualizado_em';

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'operacoes' and column_name = 'data_edicao'
    ) then
      v_operacoes_sql := v_operacoes_sql || ', data_edicao';
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'operacoes' and column_name = 'created_at'
    ) then
      v_operacoes_sql := v_operacoes_sql || ', created_at';
    end if;

    v_operacoes_sql := v_operacoes_sql
      || ', timezone(''utc'', now())) '
      || 'where empresa_id is null or usuario_id is null or criado_por is null or criado_em is null or atualizado_em is null';

    execute v_operacoes_sql using v_empresa_id, v_usuario_id, p_admin_nome;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'custos_globais' and column_name = 'empresa_id'
  ) then
    v_custos_sql := 'insert into public.custos_globais (empresa_id, preco_diesel_litro, custo_motorista_km, pedagio_medio_km, data_atualizacao) '
      || 'select $1, coalesce(preco_diesel_litro, 5.89), coalesce(custo_motorista_km, 0.85), coalesce(pedagio_medio_km, 0.32), coalesce(data_atualizacao, timezone(''utc'', now())) '
      || 'from public.custos_globais where empresa_id is null or empresa_id = $1';

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'custos_globais' and column_name = 'id'
    ) then
      v_custos_sql := v_custos_sql || ' or id = ''default''';
    end if;

    v_custos_sql := v_custos_sql
      || ' order by data_atualizacao desc nulls last limit 1 '
      || 'on conflict (empresa_id) do update set '
      || 'preco_diesel_litro = excluded.preco_diesel_litro, '
      || 'custo_motorista_km = excluded.custo_motorista_km, '
      || 'pedagio_medio_km = excluded.pedagio_medio_km, '
      || 'data_atualizacao = excluded.data_atualizacao';

    execute v_custos_sql using v_empresa_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bases' and column_name = 'empresa_id'
  ) then
    execute 'select count(*) from public.bases where empresa_id = $1'
    into v_bases_count
    using v_empresa_id;
  else
    v_bases_count := 0;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'operacoes' and column_name = 'empresa_id'
  ) then
    execute 'select count(*) from public.operacoes where empresa_id = $1'
    into v_operacoes_count
    using v_empresa_id;
  else
    v_operacoes_count := 0;
  end if;

  return query select v_empresa_id, v_usuario_id, v_bases_count, v_operacoes_count;
end;
$$;
