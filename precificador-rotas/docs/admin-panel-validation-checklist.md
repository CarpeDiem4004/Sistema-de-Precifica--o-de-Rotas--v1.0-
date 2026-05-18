# Checklist de Validacao do Painel Admin

Use este roteiro no SQL Editor do Supabase apos aplicar a migration `002_admin_panel.sql`.

## 1. Confirmar objetos criados

```sql
-- Tabelas
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'system_admins',
    'empresas_aprovacao',
    'empresas_planos_historico',
    'notificacoes',
    'empresas_metricas'
  )
order by tablename;

-- Funcoes RPC principais
select proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'is_system_admin',
    'admin_get_dashboard',
    'admin_get_empresas_pendentes',
    'admin_list_empresas',
    'admin_set_empresa_aprovacao',
    'admin_set_empresa_plano',
    'admin_set_empresa_status',
    'admin_list_logs',
    'admin_create_notificacao'
  )
order by proname;
```

Resultado esperado: todas as tabelas e funcoes listadas.

## 2. Confirmar grants de execucao

```sql
select
  routine_name,
  grantee,
  privilege_type
from information_schema.role_routine_grants
where specific_schema = 'public'
  and routine_name in (
    'is_system_admin',
    'admin_get_dashboard',
    'admin_get_empresas_pendentes',
    'admin_list_empresas',
    'admin_set_empresa_aprovacao',
    'admin_set_empresa_plano',
    'admin_set_empresa_status',
    'admin_list_logs',
    'admin_create_notificacao'
  )
order by routine_name, grantee;
```

Resultado esperado: role `authenticated` com `EXECUTE` nas funcoes acima.

## 3. Confirmar RLS e policies

```sql
-- RLS habilitado
select relname as tabela, relrowsecurity as rls_ativo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and relname in (
    'system_admins',
    'empresas_aprovacao',
    'empresas_planos_historico',
    'notificacoes',
    'empresas_metricas'
  )
order by relname;

-- Policies criadas
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'empresas_aprovacao',
    'notificacoes',
    'empresas_metricas'
  )
order by tablename, policyname;
```

Resultado esperado:
- RLS ativo nas 5 tabelas.
- Policies presentes para `empresas_aprovacao`, `notificacoes`, `empresas_metricas`.

## 4. Seed de admin global (obrigatorio)

```sql
insert into public.system_admins (user_id, email)
select id, email
from auth.users
where email = 'admin@precificador.com'
on conflict (user_id) do update set
  email = excluded.email,
  ativo = true;

select *
from public.system_admins
where email = 'admin@precificador.com';
```

Resultado esperado: 1 linha ativa em `system_admins`.

## 5. Validar trigger de aprovacao automatica

```sql
select tgname, tgenabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'empresas'
  and tgname = 'on_empresa_created_admin_defaults';
```

Resultado esperado: trigger existente e habilitado.

## 6. Smoke test funcional (com app logado como admin global)

Use a aplicacao (frontend) com usuario admin global e execute:

1. Abrir `/admin/dashboard`.
2. Verificar cards carregando sem erro de permissao.
3. Abrir `/admin/empresas`.
4. Alterar plano de uma empresa e confirmar em SQL:

```sql
select *
from public.empresas_planos_historico
order by data_alteracao desc
limit 5;
```

5. Aprovar/reprovar uma empresa e confirmar em SQL:

```sql
select e.slug, ea.status_aprovacao, ea.data_aprovacao, ea.motivo_reprovacao
from public.empresas e
join public.empresas_aprovacao ea on ea.empresa_id = e.id
order by ea.criado_em desc
limit 20;
```

6. Enviar notificacao no painel admin e validar:

```sql
select titulo, tipo, empresa_id, usuario_id, criado_em
from public.notificacoes
order by criado_em desc
limit 20;
```

## 7. Teste negativo de acesso

Logar com usuario comum (nao admin global) e tentar abrir `/admin/dashboard`.

Resultado esperado:
- Redirecionamento para dashboard do tenant.
- Sem acesso as acoes administrativas.

## 8. Consultas de diagnostico rapido

```sql
-- Verificar se funcao principal existe com assinatura correta
select to_regprocedure('public.admin_set_empresa_aprovacao(uuid,boolean,text,text)') as fn_aprovacao;
select to_regprocedure('public.admin_set_empresa_plano(uuid,text,text)') as fn_plano;
select to_regprocedure('public.admin_set_empresa_status(uuid,text,text)') as fn_status;

-- Ultimos erros de permissao geralmente aparecem como exception durante RPC
-- Validar se usuario atual esta em system_admins
select public.is_system_admin();
```

Se qualquer `to_regprocedure(...)` retornar `null`, a migration nao foi aplicada completamente.
