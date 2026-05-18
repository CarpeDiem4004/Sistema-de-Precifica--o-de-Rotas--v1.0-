create extension if not exists pgcrypto;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome_fantasia text not null,
  razao_social text not null,
  cnpj text unique,
  email_contato text not null,
  telefone text,
  endereco text,
  plano text not null default 'basico' check (plano in ('basico', 'profissional', 'enterprise', 'trial')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'trial')),
  data_ativacao timestamptz not null default timezone('utc', now()),
  data_expiracao timestamptz,
  criado_em timestamptz not null default timezone('utc', now())
);

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  email text not null,
  cargo text not null default 'operador' check (cargo in ('admin', 'operador', 'visualizador')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  ultimo_acesso timestamptz,
  criado_em timestamptz not null default timezone('utc', now()),
  unique (empresa_id, email)
);

create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  email text not null,
  cargo text not null check (cargo in ('admin', 'operador', 'visualizador')),
  token text not null unique,
  expira_em timestamptz not null,
  criado_em timestamptz not null default timezone('utc', now()),
  usado_em timestamptz
);

create table if not exists public.bases (
  id text primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  codigo text not null,
  nome text not null default '',
  endereco text not null,
  lat double precision,
  lng double precision,
  criado_em timestamptz not null default timezone('utc', now()),
  unique (empresa_id, codigo)
);

create table if not exists public.operacoes (
  id text primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete restrict,
  ativo boolean not null default true,
  nome_operacao text not null,
  criado_por text not null,
  editado_por text,
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
  historico_alteracoes jsonb not null default '[]'::jsonb,
  status text not null default 'rascunho' check (status in ('rascunho', 'aprovada')),
  data_aprovacao timestamptz,
  criado_em timestamptz not null default timezone('utc', now()),
  atualizado_em timestamptz not null default timezone('utc', now())
);

create table if not exists public.custos_globais (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  preco_diesel_litro double precision not null,
  custo_motorista_km double precision not null,
  pedagio_medio_km double precision not null,
  data_atualizacao timestamptz not null default timezone('utc', now())
);

create table if not exists public.logs_acesso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete set null,
  empresa_id uuid references public.empresas(id) on delete set null,
  acao text not null,
  ip text,
  user_agent text,
  criado_em timestamptz not null default timezone('utc', now())
);

create index if not exists idx_bases_empresa on public.bases(empresa_id);
create index if not exists idx_operacoes_empresa on public.operacoes(empresa_id);
create index if not exists idx_operacoes_usuario on public.operacoes(usuario_id);
create index if not exists idx_usuarios_empresa on public.usuarios(empresa_id);
create index if not exists idx_convites_token on public.convites(token);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists update_operacoes_updated_at on public.operacoes;
create trigger update_operacoes_updated_at
before update on public.operacoes
for each row
execute function public.update_updated_at_column();

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

create or replace function public.bootstrap_empresa_admin(
  p_nome text,
  p_empresa_nome text,
  p_empresa_slug text,
  p_email text,
  p_cnpj text default null,
  p_telefone text default null
)
returns table (empresa_id uuid, usuario_id uuid, slug text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_empresa_id uuid;
  v_usuario_id uuid;
begin
  if v_auth_user_id is null then
    raise exception 'Usuário autenticado não encontrado';
  end if;

  select u.empresa_id, u.id
  into v_empresa_id, v_usuario_id
  from public.usuarios u
  where u.auth_user_id = v_auth_user_id;

  if v_empresa_id is not null then
    return query
    select v_empresa_id, v_usuario_id, e.slug
    from public.empresas e
    where e.id = v_empresa_id;
    return;
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
    p_email,
    nullif(trim(coalesce(p_telefone, '')), ''),
    'trial',
    'ativo',
    timezone('utc', now()) + interval '30 days'
  )
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
    v_auth_user_id,
    v_empresa_id,
    p_nome,
    p_email,
    'admin',
    'ativo',
    timezone('utc', now())
  )
  returning id into v_usuario_id;

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

  return query
  select v_empresa_id, v_usuario_id, e.slug
  from public.empresas e
  where e.id = v_empresa_id;
end;
$$;

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
  -- Convites são processados no fluxo accept_invite.
  if v_convite_token is not null then
    return new;
  end if;

  -- Apenas cadastro de empresa com metadata completa deve provisionar tenant.
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

create or replace function public.accept_invite(
  p_token text,
  p_nome text
)
returns table (empresa_id uuid, usuario_id uuid, empresa_slug text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_auth_email text;
  v_invite public.convites%rowtype;
  v_usuario_id uuid;
  v_empresa_slug text;
begin
  if v_auth_user_id is null then
    raise exception 'Usuário autenticado não encontrado';
  end if;

  select email into v_auth_email from auth.users where id = v_auth_user_id;

  select *
  into v_invite
  from public.convites
  where token = p_token;

  if v_invite.id is null then
    raise exception 'Convite não encontrado';
  end if;

  if v_invite.usado_em is not null then
    raise exception 'Convite já utilizado';
  end if;

  if v_invite.expira_em < timezone('utc', now()) then
    raise exception 'Convite expirado';
  end if;

  if lower(coalesce(v_auth_email, '')) <> lower(v_invite.email) then
    raise exception 'O email autenticado não corresponde ao convite';
  end if;

  select id into v_usuario_id
  from public.usuarios
  where auth_user_id = v_auth_user_id;

  if v_usuario_id is null then
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
      v_auth_user_id,
      v_invite.empresa_id,
      p_nome,
      v_invite.email,
      v_invite.cargo,
      'ativo',
      timezone('utc', now())
    )
    returning id into v_usuario_id;
  else
    update public.usuarios
    set
      empresa_id = v_invite.empresa_id,
      nome = coalesce(nullif(trim(p_nome), ''), nome),
      email = v_invite.email,
      cargo = v_invite.cargo,
      status = 'ativo',
      ultimo_acesso = timezone('utc', now())
    where id = v_usuario_id;
  end if;

  update public.convites
  set usado_em = timezone('utc', now())
  where id = v_invite.id;

  select slug into v_empresa_slug
  from public.empresas
  where id = v_invite.empresa_id;

  return query
  select v_invite.empresa_id, v_usuario_id, v_empresa_slug;
end;
$$;

create or replace function public.get_convite_publico(p_token text)
returns table (
  email text,
  cargo text,
  empresa_slug text,
  empresa_nome text,
  expira_em timestamptz,
  usado_em timestamptz,
  expirado boolean
)
language sql
security definer
set search_path = public
as $$
  select
    c.email,
    c.cargo,
    e.slug as empresa_slug,
    e.nome_fantasia as empresa_nome,
    c.expira_em,
    c.usado_em,
    c.expira_em < timezone('utc', now()) as expirado
  from public.convites c
  join public.empresas e on e.id = c.empresa_id
  where c.token = p_token
  limit 1
$$;

create or replace function public.create_convite(
  p_email text,
  p_cargo text,
  p_redirect_base text default null
)
returns table (
  id uuid,
  email text,
  cargo text,
  token text,
  expira_em timestamptz,
  empresa_slug text,
  link text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid := public.current_empresa_id();
  v_empresa_slug text;
  v_token text := encode(gen_random_bytes(24), 'hex');
  v_convite_id uuid;
  v_expira_em timestamptz := timezone('utc', now()) + interval '7 days';
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'Apenas administradores podem criar convites';
  end if;

  if v_empresa_id is null then
    raise exception 'Empresa não encontrada para o usuário atual';
  end if;

  select slug into v_empresa_slug from public.empresas where id = v_empresa_id;

  insert into public.convites (
    empresa_id,
    email,
    cargo,
    token,
    expira_em
  )
  values (
    v_empresa_id,
    lower(trim(p_email)),
    p_cargo,
    v_token,
    v_expira_em
  )
  returning convites.id into v_convite_id;

  return query
  select
    v_convite_id,
    lower(trim(p_email)),
    p_cargo,
    v_token,
    v_expira_em,
    v_empresa_slug,
    case
      when p_redirect_base is null or trim(p_redirect_base) = '' then null
      else trim(trailing '/' from p_redirect_base) || '/convites/' || v_token
    end;
end;
$$;

create or replace function public.revoke_convite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'Apenas administradores podem revogar convites';
  end if;

  delete from public.convites
  where id = p_invite_id
    and empresa_id = public.current_empresa_id();
end;
$$;

alter table public.empresas enable row level security;
alter table public.usuarios enable row level security;
alter table public.convites enable row level security;
alter table public.bases enable row level security;
alter table public.operacoes enable row level security;
alter table public.custos_globais enable row level security;
alter table public.logs_acesso enable row level security;

drop policy if exists "empresas_select_own" on public.empresas;
create policy "empresas_select_own"
on public.empresas
for select
to authenticated
using (id = public.current_empresa_id());

drop policy if exists "usuarios_select_company" on public.usuarios;
create policy "usuarios_select_self_or_system_admin"
on public.usuarios
for select
to authenticated
using (auth_user_id = auth.uid() or public.is_system_admin(auth.uid()));

drop policy if exists "usuarios_update_self" on public.usuarios;
create policy "usuarios_update_self"
on public.usuarios
for update
to authenticated
using (auth_user_id = auth.uid() or public.is_system_admin(auth.uid()))
with check (auth_user_id = auth.uid() or public.is_system_admin(auth.uid()));

drop policy if exists "bases_rw_company" on public.bases;
create policy "bases_rw_company"
on public.bases
for all
to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "operacoes_rw_company" on public.operacoes;
create policy "operacoes_rw_company"
on public.operacoes
for all
to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "custos_rw_company" on public.custos_globais;
create policy "custos_rw_company"
on public.custos_globais
for all
to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "convites_rw_company" on public.convites;
drop policy if exists "convites_admin_rw" on public.convites;
create policy "convites_admin_rw"
on public.convites
for all
to authenticated
using (empresa_id = public.current_empresa_id() and public.current_user_role() = 'admin')
with check (empresa_id = public.current_empresa_id() and public.current_user_role() = 'admin');

drop policy if exists "logs_rw_company" on public.logs_acesso;
create policy "logs_rw_company"
on public.logs_acesso
for all
to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());
