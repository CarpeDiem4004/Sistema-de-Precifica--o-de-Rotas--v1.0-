-- Script de validacao do painel admin
-- Uso: rodar no SQL Editor do Supabase apos aplicar a migration 002_admin_panel.sql

with expected_tables as (
  select unnest(array[
    'system_admins',
    'empresas_aprovacao',
    'empresas_planos_historico',
    'notificacoes',
    'empresas_metricas'
  ]) as name
),
actual_tables as (
  select tablename as name
  from pg_tables
  where schemaname = 'public'
),
expected_columns as (
  select *
  from (
    values
      ('system_admins', 'user_id'),
      ('system_admins', 'email'),
      ('system_admins', 'ativo'),
      ('system_admins', 'criado_em'),
      ('empresas_aprovacao', 'empresa_id'),
      ('empresas_aprovacao', 'status_aprovacao'),
      ('notificacoes', 'titulo'),
      ('notificacoes', 'mensagem')
  ) as v(tablename, column_name)
),
actual_columns as (
  select table_name as tablename, column_name
  from information_schema.columns
  where table_schema = 'public'
),
expected_functions as (
  select unnest(array[
    'is_system_admin',
    'admin_get_dashboard',
    'admin_get_empresas_pendentes',
    'admin_list_empresas',
    'admin_set_empresa_aprovacao',
    'admin_set_empresa_plano',
    'admin_set_empresa_status',
    'admin_list_logs',
    'admin_create_notificacao'
  ]) as name
),
actual_functions as (
  select proname as name
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
),
expected_rls_tables as (
  select unnest(array[
    'system_admins',
    'empresas_aprovacao',
    'empresas_planos_historico',
    'notificacoes',
    'empresas_metricas'
  ]) as name
),
actual_rls as (
  select relname as name, relrowsecurity as enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
),
expected_policies as (
  select *
  from (
    values
      ('empresas_aprovacao', 'empresas_aprovacao_select_company'),
      ('empresas_metricas', 'empresas_metricas_select_company'),
      ('notificacoes', 'notificacoes_select_scope'),
      ('notificacoes', 'notificacoes_update_scope')
  ) as v(tablename, policyname)
),
actual_policies as (
  select tablename, policyname
  from pg_policies
  where schemaname = 'public'
),
expected_grants as (
  select *
  from (
    values
      ('is_system_admin'),
      ('admin_get_dashboard'),
      ('admin_get_empresas_pendentes'),
      ('admin_list_empresas'),
      ('admin_set_empresa_aprovacao'),
      ('admin_set_empresa_plano'),
      ('admin_set_empresa_status'),
      ('admin_list_logs'),
      ('admin_create_notificacao')
  ) as v(routine_name)
),
actual_grants as (
  select distinct routine_name
  from information_schema.role_routine_grants
  where specific_schema = 'public'
    and grantee = 'authenticated'
    and privilege_type = 'EXECUTE'
)
select *
from (
  select
    'tables' as categoria,
    e.name as item,
    case when a.name is not null then 'OK' else 'ERRO' end as status,
    case when a.name is not null then 'Tabela encontrada' else 'Tabela ausente' end as detalhe
  from expected_tables e
  left join actual_tables a on a.name = e.name

  union all

  select
    'functions' as categoria,
    e.name as item,
    case when a.name is not null then 'OK' else 'ERRO' end as status,
    case when a.name is not null then 'Função encontrada' else 'Função ausente' end as detalhe
  from expected_functions e
  left join actual_functions a on a.name = e.name

  union all

  select
    'columns' as categoria,
    e.tablename || '.' || e.column_name as item,
    case when a.column_name is not null then 'OK' else 'ERRO' end as status,
    case when a.column_name is not null then 'Coluna encontrada' else 'Coluna ausente' end as detalhe
  from expected_columns e
  left join actual_columns a
    on a.tablename = e.tablename
   and a.column_name = e.column_name

  union all

  select
    'rls' as categoria,
    e.name as item,
    case when a.enabled = true then 'OK' else 'ERRO' end as status,
    case when a.enabled = true then 'RLS habilitado' else 'RLS desabilitado ou tabela ausente' end as detalhe
  from expected_rls_tables e
  left join actual_rls a on a.name = e.name

  union all

  select
    'policies' as categoria,
    e.tablename || '.' || e.policyname as item,
    case when a.policyname is not null then 'OK' else 'ERRO' end as status,
    case when a.policyname is not null then 'Policy encontrada' else 'Policy ausente' end as detalhe
  from expected_policies e
  left join actual_policies a
    on a.tablename = e.tablename
   and a.policyname = e.policyname

  union all

  select
    'grants' as categoria,
    e.routine_name as item,
    case when a.routine_name is not null then 'OK' else 'ERRO' end as status,
    case when a.routine_name is not null then 'Grant EXECUTE para authenticated encontrado' else 'Grant EXECUTE ausente para authenticated' end as detalhe
  from expected_grants e
  left join actual_grants a on a.routine_name = e.routine_name

  union all

  select
    'trigger' as categoria,
    'empresas.on_empresa_created_admin_defaults' as item,
    case when exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'empresas'
        and t.tgname = 'on_empresa_created_admin_defaults'
        and t.tgenabled in ('O', 'A')
    ) then 'OK' else 'ERRO' end as status,
    case when exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'empresas'
        and t.tgname = 'on_empresa_created_admin_defaults'
        and t.tgenabled in ('O', 'A')
    ) then 'Trigger presente e habilitado' else 'Trigger ausente ou desabilitado' end as detalhe

  union all

  select
    'signature' as categoria,
    'admin_set_empresa_aprovacao(uuid,boolean,text,text)' as item,
    case when to_regprocedure('public.admin_set_empresa_aprovacao(uuid,boolean,text,text)') is not null then 'OK' else 'ERRO' end as status,
    case when to_regprocedure('public.admin_set_empresa_aprovacao(uuid,boolean,text,text)') is not null then 'Assinatura válida' else 'Assinatura não encontrada' end as detalhe

  union all

  select
    'signature' as categoria,
    'admin_set_empresa_plano(uuid,text,text)' as item,
    case when to_regprocedure('public.admin_set_empresa_plano(uuid,text,text)') is not null then 'OK' else 'ERRO' end as status,
    case when to_regprocedure('public.admin_set_empresa_plano(uuid,text,text)') is not null then 'Assinatura válida' else 'Assinatura não encontrada' end as detalhe

  union all

  select
    'signature' as categoria,
    'admin_set_empresa_status(uuid,text,text)' as item,
    case when to_regprocedure('public.admin_set_empresa_status(uuid,text,text)') is not null then 'OK' else 'ERRO' end as status,
    case when to_regprocedure('public.admin_set_empresa_status(uuid,text,text)') is not null then 'Assinatura válida' else 'Assinatura não encontrada' end as detalhe
) report
order by categoria, item;

-- Resumo final
with report as (
  with expected_tables as (
    select unnest(array[
      'system_admins',
      'empresas_aprovacao',
      'empresas_planos_historico',
      'notificacoes',
      'empresas_metricas'
    ]) as name
  ),
  actual_tables as (
    select tablename as name
    from pg_tables
    where schemaname = 'public'
  ),
  expected_columns as (
    select *
    from (
      values
        ('system_admins', 'user_id'),
        ('system_admins', 'email'),
        ('system_admins', 'ativo'),
        ('system_admins', 'criado_em'),
        ('empresas_aprovacao', 'empresa_id'),
        ('empresas_aprovacao', 'status_aprovacao'),
        ('notificacoes', 'titulo'),
        ('notificacoes', 'mensagem')
    ) as v(tablename, column_name)
  ),
  actual_columns as (
    select table_name as tablename, column_name
    from information_schema.columns
    where table_schema = 'public'
  ),
  expected_functions as (
    select unnest(array[
      'is_system_admin',
      'admin_get_dashboard',
      'admin_get_empresas_pendentes',
      'admin_list_empresas',
      'admin_set_empresa_aprovacao',
      'admin_set_empresa_plano',
      'admin_set_empresa_status',
      'admin_list_logs',
      'admin_create_notificacao'
    ]) as name
  ),
  actual_functions as (
    select proname as name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  )
  select case when a.name is not null then 1 else 0 end as ok
  from expected_tables e
  left join actual_tables a on a.name = e.name

  union all

  select case when a.name is not null then 1 else 0 end as ok
  from expected_functions e
  left join actual_functions a on a.name = e.name

  union all

  select case when a.column_name is not null then 1 else 0 end as ok
  from expected_columns e
  left join actual_columns a
    on a.tablename = e.tablename
   and a.column_name = e.column_name
)
select
  count(*) as total_checks,
  sum(ok) as total_ok,
  count(*) - sum(ok) as total_erros,
  case when count(*) = sum(ok) then 'VALIDACAO ESTRUTURAL OK' else 'VALIDACAO ESTRUTURAL COM FALHAS' end as resumo
from report;
