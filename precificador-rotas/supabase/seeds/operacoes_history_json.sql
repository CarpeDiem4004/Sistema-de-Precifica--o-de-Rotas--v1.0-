alter table public.operacoes
add column if not exists historico_alteracoes jsonb not null default '[]'::jsonb;

comment on column public.operacoes.historico_alteracoes is 'Historico de alteracoes da operacao em formato JSON, compartilhado entre usuarios.';