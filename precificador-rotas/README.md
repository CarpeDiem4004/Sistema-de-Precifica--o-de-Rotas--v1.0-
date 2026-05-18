# Precificador de Rotas

Aplicação React + Vite para precificação logística, agora preparada para arquitetura multi-tenant com Supabase.

## Documentação principal

- Migração segura do banco legado: [docs/safe-migration-checklist.md](docs/safe-migration-checklist.md)
- Domínio wildcard e Vercel: [docs/wildcard-domain-vercel.md](docs/wildcard-domain-vercel.md)
- Schema alvo do Supabase: [supabase/schema.sql](supabase/schema.sql)
- Migração do single-tenant para empresa: [supabase/migrations/001_safe_migration_from_single_tenant.sql](supabase/migrations/001_safe_migration_from_single_tenant.sql)
- Módulo administrativo global: [supabase/migrations/002_admin_panel.sql](supabase/migrations/002_admin_panel.sql)
- Relatório rápido de validação do admin: [supabase/migrations/999_admin_validation_report.sql](supabase/migrations/999_admin_validation_report.sql)

## Variáveis de ambiente

Use como base o arquivo [.env.example](.env.example).

Variáveis mínimas:

- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `VITE_ADMIN_EMAILS` (fallback de visibilidade do painel admin no frontend)

## Painel administrativo global

Rotas adicionadas:

- `/admin/dashboard`
- `/admin/empresas`
- `/admin/logs`
- `/admin/notificacoes`

Pré-requisitos para acesso:

1. Rodar a migration [supabase/migrations/002_admin_panel.sql](supabase/migrations/002_admin_panel.sql).
2. Cadastrar pelo menos um admin de sistema na tabela `public.system_admins`.

Exemplo de seed inicial:

```sql
insert into public.system_admins (user_id, email)
select id, email
from auth.users
where email = 'admin@precificador.com'
on conflict (user_id) do update set
	email = excluded.email,
	ativo = true;
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
