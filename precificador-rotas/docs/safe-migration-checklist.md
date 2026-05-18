# Migração Segura do Banco Atual

## Cenário
O banco antigo tinha tabelas de uso único. A arquitetura nova exige `empresa_id`, `usuario_id` e RLS.

## Ordem recomendada
1. Criar um usuário administrador no Supabase Auth.
2. Executar o schema alvo em `supabase/schema.sql`.
3. Executar a migration em `supabase/migrations/001_safe_migration_from_single_tenant.sql`.
4. Rodar a função de migração apontando os dados antigos para a nova empresa.

## Exemplo de execução
No SQL Editor, substitua os valores e execute:

```sql
select *
from public.migrate_single_tenant_to_empresa(
  p_empresa_slug := 'transportadora-alpha',
  p_empresa_nome := 'Transportadora Alpha',
  p_admin_auth_user_id := 'UUID_DO_AUTH_USER',
  p_admin_nome := 'Administrador',
  p_admin_email := 'admin@alpha.com.br',
  p_cnpj := '00.000.000/0000-00',
  p_telefone := '(11) 99999-9999'
);
```

## O que a migration faz
- cria ou reaproveita a empresa
- cria ou reaproveita o usuário admin vinculado ao auth user
- preenche `empresa_id` em bases antigas
- preenche `empresa_id`, `usuario_id`, autoria e timestamps em operações antigas
- migra os custos globais antigos para a empresa nova

## Antes de rodar em produção
- faça backup do banco
- teste em um projeto Supabase separado
- confirme que o auth user do admin existe em `auth.users`
