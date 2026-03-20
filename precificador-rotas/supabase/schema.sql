create extension if not exists pgcrypto;

create table if not exists public.bases (
  id text primary key,
  codigo text not null unique,
  nome text not null default '',
  endereco text not null,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.operacoes (
  id text primary key,
  nome_operacao text not null,
  user_id text not null,
  created_at timestamptz not null,
  data_aprovacao timestamptz,
  criado_por text not null,
  editado_por text,
  data_edicao timestamptz,
  codigo_origem text not null,
  codigo_destino text not null,
  endereco_origem text,
  endereco_destino text,
  distancia_km double precision not null,
  tempo_estimado text,
  tipo_veiculo text not null check (tipo_veiculo in ('proprio', 'agregado')),
  valor_agregado double precision,
  custo_diesel_litro_original double precision not null,
  consumo_km_l double precision not null,
  custo_combustivel_original double precision not null,
  custo_motorista_original double precision not null,
  pedagio double precision not null,
  outros_custos double precision not null default 0,
  valor_cliente double precision,
  valor_venda double precision not null,
  custo_total_original double precision not null,
  lucro_original double precision not null,
  margem_original_percent double precision not null,
  margem_atual_percent double precision,
  lucro_atual double precision,
  status text not null check (status in ('rascunho', 'aprovada'))
);

create table if not exists public.custos_globais (
  id text primary key,
  preco_diesel_litro double precision not null,
  custo_motorista_km double precision not null,
  pedagio_medio_km double precision not null,
  data_atualizacao timestamptz not null
);

alter table public.bases enable row level security;
alter table public.operacoes enable row level security;
alter table public.custos_globais enable row level security;

create policy if not exists "bases public access"
  on public.bases
  for all
  using (true)
  with check (true);

create policy if not exists "operacoes public access"
  on public.operacoes
  for all
  using (true)
  with check (true);

create policy if not exists "custos globais public access"
  on public.custos_globais
  for all
  using (true)
  with check (true);
