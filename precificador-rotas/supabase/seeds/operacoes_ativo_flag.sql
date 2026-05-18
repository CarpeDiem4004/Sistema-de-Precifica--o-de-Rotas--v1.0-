alter table public.operacoes
add column if not exists ativo boolean not null default true;

comment on column public.operacoes.ativo is 'Define se a rota esta ativa para operacao e indicadores.';