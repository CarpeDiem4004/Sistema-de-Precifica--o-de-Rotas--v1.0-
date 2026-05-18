begin;

create table if not exists public.system_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  ativo boolean not null default true,
  criado_em timestamptz not null default timezone('utc', now())
);

create table if not exists public.empresas_aprovacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresas(id) on delete cascade,
  status_aprovacao text not null default 'pendente' check (status_aprovacao in ('pendente', 'aprovada', 'reprovada', 'suspensa')),
  aprovado_por uuid references auth.users(id),
  data_aprovacao timestamptz,
  motivo_reprovacao text,
  observacoes text,
  criado_em timestamptz not null default timezone('utc', now())
);

create table if not exists public.empresas_planos_historico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  plano_anterior text,
  plano_novo text not null,
  alterado_por uuid references auth.users(id),
  motivo text,
  data_alteracao timestamptz not null default timezone('utc', now())
);

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  tipo text not null default 'info' check (tipo in ('info', 'success', 'warning', 'error')),
  lida boolean not null default false,
  link text,
  criado_em timestamptz not null default timezone('utc', now())
);

create table if not exists public.empresas_metricas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  data_referencia date not null,
  total_operacoes integer not null default 0,
  total_bases integer not null default 0,
  total_usuarios integer not null default 0,
  total_calculos integer not null default 0,
  criado_em timestamptz not null default timezone('utc', now()),
  unique (empresa_id, data_referencia)
);

create index if not exists idx_empresas_aprovacao_status on public.empresas_aprovacao(status_aprovacao);
create index if not exists idx_notificacoes_empresa on public.notificacoes(empresa_id);
create index if not exists idx_notificacoes_usuario on public.notificacoes(usuario_id);
create index if not exists idx_notificacoes_lida on public.notificacoes(lida);
create index if not exists idx_metricas_empresa_data on public.empresas_metricas(empresa_id, data_referencia);
create index if not exists idx_planos_historico_empresa on public.empresas_planos_historico(empresa_id, data_alteracao desc);

create or replace function public.is_system_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.system_admins sa
    where sa.ativo = true
      and (
        sa.user_id = coalesce(p_user_id, auth.uid())
        or (
          sa.email is not null
          and lower(sa.email) = (
            select lower(u.email)
            from auth.users u
            where u.id = coalesce(p_user_id, auth.uid())
            limit 1
          )
        )
      )
  );
$$;

create or replace function public.admin_assert_system_admin()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_system_admin(auth.uid()) then
    raise exception 'Acesso restrito a administradores do sistema';
  end if;
end;
$$;

create or replace function public.handle_new_empresa_admin_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.empresas_aprovacao (empresa_id, status_aprovacao)
  values (new.id, 'pendente')
  on conflict (empresa_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_empresa_created_admin_defaults on public.empresas;
create trigger on_empresa_created_admin_defaults
after insert on public.empresas
for each row
execute function public.handle_new_empresa_admin_defaults();

create or replace function public.admin_set_empresa_aprovacao(
  p_empresa_id uuid,
  p_aprovado boolean,
  p_motivo text default null,
  p_observacoes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_novo_status text;
  v_aprovado_por uuid := auth.uid();
begin
  perform public.admin_assert_system_admin();

  if not exists (select 1 from public.empresas where id = p_empresa_id) then
    raise exception 'Empresa não encontrada';
  end if;

  if p_aprovado then
    v_novo_status := 'aprovada';

    update public.empresas
    set status = 'ativo'
    where id = p_empresa_id;
  else
    v_novo_status := 'reprovada';

    update public.empresas
    set status = 'inativo'
    where id = p_empresa_id;
  end if;

  insert into public.empresas_aprovacao (
    empresa_id,
    status_aprovacao,
    aprovado_por,
    data_aprovacao,
    motivo_reprovacao,
    observacoes
  )
  values (
    p_empresa_id,
    v_novo_status,
    v_aprovado_por,
    timezone('utc', now()),
    case when p_aprovado then null else p_motivo end,
    p_observacoes
  )
  on conflict (empresa_id)
  do update set
    status_aprovacao = excluded.status_aprovacao,
    aprovado_por = excluded.aprovado_por,
    data_aprovacao = excluded.data_aprovacao,
    motivo_reprovacao = excluded.motivo_reprovacao,
    observacoes = excluded.observacoes;

  insert into public.notificacoes (empresa_id, titulo, mensagem, tipo)
  values (
    p_empresa_id,
    case when p_aprovado then 'Empresa aprovada' else 'Empresa reprovada' end,
    case
      when p_aprovado then 'Sua empresa foi aprovada e já pode operar normalmente.'
      else 'Sua empresa foi reprovada. Motivo: ' || coalesce(p_motivo, 'Não informado')
    end,
    case when p_aprovado then 'success' else 'error' end
  );

  return true;
end;
$$;

create or replace function public.admin_set_empresa_plano(
  p_empresa_id uuid,
  p_novo_plano text,
  p_motivo text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_plano_anterior text;
begin
  perform public.admin_assert_system_admin();

  if p_novo_plano not in ('trial', 'basico', 'profissional', 'enterprise') then
    raise exception 'Plano inválido';
  end if;

  select plano into v_plano_anterior
  from public.empresas
  where id = p_empresa_id;

  if v_plano_anterior is null then
    raise exception 'Empresa não encontrada';
  end if;

  update public.empresas
  set plano = p_novo_plano,
      data_expiracao = case
        when p_novo_plano = 'trial' then timezone('utc', now()) + interval '30 days'
        when p_novo_plano in ('basico', 'profissional') then timezone('utc', now()) + interval '1 year'
        when p_novo_plano = 'enterprise' then null
        else data_expiracao
      end
  where id = p_empresa_id;

  insert into public.empresas_planos_historico (
    empresa_id,
    plano_anterior,
    plano_novo,
    alterado_por,
    motivo
  )
  values (
    p_empresa_id,
    v_plano_anterior,
    p_novo_plano,
    auth.uid(),
    p_motivo
  );

  insert into public.notificacoes (empresa_id, titulo, mensagem, tipo)
  values (
    p_empresa_id,
    'Plano atualizado',
    'Seu plano foi alterado para ' || p_novo_plano || '.',
    'info'
  );

  return true;
end;
$$;

create or replace function public.admin_set_empresa_status(
  p_empresa_id uuid,
  p_status text,
  p_observacoes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.admin_assert_system_admin();

  if p_status not in ('ativo', 'inativo', 'trial') then
    raise exception 'Status inválido';
  end if;

  update public.empresas
  set status = p_status
  where id = p_empresa_id;

  if not found then
    raise exception 'Empresa não encontrada';
  end if;

  if p_status = 'inativo' then
    insert into public.empresas_aprovacao (empresa_id, status_aprovacao, aprovado_por, data_aprovacao, observacoes)
    values (p_empresa_id, 'suspensa', auth.uid(), timezone('utc', now()), p_observacoes)
    on conflict (empresa_id)
    do update set
      status_aprovacao = 'suspensa',
      aprovado_por = auth.uid(),
      data_aprovacao = timezone('utc', now()),
      observacoes = excluded.observacoes;
  end if;

  insert into public.notificacoes (empresa_id, titulo, mensagem, tipo)
  values (
    p_empresa_id,
    'Status da empresa atualizado',
    'O status da empresa foi alterado para ' || p_status || '.',
    case when p_status = 'inativo' then 'warning' else 'info' end
  );

  return true;
end;
$$;

create or replace function public.admin_get_empresas_pendentes()
returns table (
  empresa_id uuid,
  slug text,
  nome_fantasia text,
  email_contato text,
  telefone text,
  data_cadastro timestamptz,
  status_aprovacao text,
  dias_pendente integer
)
language plpgsql
security definer
stable
set search_path = public, auth
as $$
begin
  perform public.admin_assert_system_admin();

  return query
  select
    e.id as empresa_id,
    e.slug,
    e.nome_fantasia,
    e.email_contato,
    e.telefone,
    e.criado_em as data_cadastro,
    coalesce(ea.status_aprovacao, 'pendente') as status_aprovacao,
    extract(day from (timezone('utc', now()) - e.criado_em))::integer as dias_pendente
  from public.empresas e
  left join public.empresas_aprovacao ea on ea.empresa_id = e.id
  where coalesce(ea.status_aprovacao, 'pendente') = 'pendente'
  order by e.criado_em asc;
end;
$$;

create or replace function public.admin_get_dashboard()
returns table (
  total_empresas bigint,
  empresas_ativas bigint,
  empresas_trial bigint,
  empresas_pendentes bigint,
  total_usuarios bigint,
  total_operacoes bigint,
  faturamento_mensal numeric
)
language plpgsql
security definer
stable
set search_path = public, auth
as $$
begin
  perform public.admin_assert_system_admin();

  return query
  select
    (select count(*) from public.empresas),
    (select count(*) from public.empresas where status = 'ativo'),
    (select count(*) from public.empresas where plano = 'trial'),
    (select count(*) from public.empresas_aprovacao where status_aprovacao = 'pendente'),
    (select count(*) from public.usuarios where status = 'ativo'),
    (select count(*) from public.operacoes),
    0::numeric;
end;
$$;

create or replace function public.admin_list_empresas(
  p_search text default null,
  p_status text default null,
  p_limit integer default 200,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  nome_fantasia text,
  razao_social text,
  cnpj text,
  email_contato text,
  telefone text,
  plano text,
  status text,
  data_ativacao timestamptz,
  data_expiracao timestamptz,
  criado_em timestamptz,
  status_aprovacao text
)
language plpgsql
security definer
stable
set search_path = public, auth
as $$
begin
  perform public.admin_assert_system_admin();

  return query
  select
    e.id,
    e.slug,
    e.nome_fantasia,
    e.razao_social,
    e.cnpj,
    e.email_contato,
    e.telefone,
    e.plano,
    e.status,
    e.data_ativacao,
    e.data_expiracao,
    e.criado_em,
    coalesce(ea.status_aprovacao, 'pendente')
  from public.empresas e
  left join public.empresas_aprovacao ea on ea.empresa_id = e.id
  where (
      p_search is null
      or trim(p_search) = ''
      or e.nome_fantasia ilike '%' || trim(p_search) || '%'
      or e.email_contato ilike '%' || trim(p_search) || '%'
      or coalesce(e.cnpj, '') ilike '%' || trim(p_search) || '%'
      or e.slug ilike '%' || trim(p_search) || '%'
    )
    and (
      p_status is null
      or trim(p_status) = ''
      or p_status = 'todos'
      or e.status = p_status
    )
  order by e.criado_em desc
  limit greatest(coalesce(p_limit, 200), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.admin_list_logs(
  p_limit integer default 200,
  p_empresa_id uuid default null
)
returns table (
  id uuid,
  criado_em timestamptz,
  acao text,
  ip text,
  user_agent text,
  empresa_id uuid,
  empresa_nome text,
  usuario_id uuid,
  usuario_nome text,
  usuario_email text
)
language plpgsql
security definer
stable
set search_path = public, auth
as $$
begin
  perform public.admin_assert_system_admin();

  return query
  select
    l.id,
    l.criado_em,
    l.acao,
    l.ip,
    l.user_agent,
    l.empresa_id,
    e.nome_fantasia,
    l.usuario_id,
    u.nome,
    u.email
  from public.logs_acesso l
  left join public.empresas e on e.id = l.empresa_id
  left join public.usuarios u on u.id = l.usuario_id
  where p_empresa_id is null or l.empresa_id = p_empresa_id
  order by l.criado_em desc
  limit greatest(coalesce(p_limit, 200), 1);
end;
$$;

create or replace function public.admin_create_notificacao(
  p_titulo text,
  p_mensagem text,
  p_tipo text default 'info',
  p_empresa_id uuid default null,
  p_usuario_id uuid default null,
  p_link text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid;
begin
  perform public.admin_assert_system_admin();

  if p_tipo not in ('info', 'success', 'warning', 'error') then
    raise exception 'Tipo de notificação inválido';
  end if;

  if p_empresa_id is null and p_usuario_id is null then
    raise exception 'Informe empresa ou usuário para notificação';
  end if;

  insert into public.notificacoes (empresa_id, usuario_id, titulo, mensagem, tipo, link)
  values (p_empresa_id, p_usuario_id, p_titulo, p_mensagem, p_tipo, p_link)
  returning id into v_id;

  return v_id;
end;
$$;

alter table public.system_admins enable row level security;
alter table public.empresas_aprovacao enable row level security;
alter table public.empresas_planos_historico enable row level security;
alter table public.notificacoes enable row level security;
alter table public.empresas_metricas enable row level security;

drop policy if exists "empresas_aprovacao_select_company" on public.empresas_aprovacao;
create policy "empresas_aprovacao_select_company"
on public.empresas_aprovacao
for select
to authenticated
using (empresa_id = public.current_empresa_id());

drop policy if exists "empresas_metricas_select_company" on public.empresas_metricas;
create policy "empresas_metricas_select_company"
on public.empresas_metricas
for select
to authenticated
using (empresa_id = public.current_empresa_id());

drop policy if exists "notificacoes_select_scope" on public.notificacoes;
create policy "notificacoes_select_scope"
on public.notificacoes
for select
to authenticated
using (
  (empresa_id is not null and empresa_id = public.current_empresa_id())
  or (usuario_id is not null and usuario_id = (
    select id from public.usuarios where auth_user_id = auth.uid() limit 1
  ))
);

drop policy if exists "notificacoes_update_scope" on public.notificacoes;
create policy "notificacoes_update_scope"
on public.notificacoes
for update
to authenticated
using (
  (empresa_id is not null and empresa_id = public.current_empresa_id())
  or (usuario_id is not null and usuario_id = (
    select id from public.usuarios where auth_user_id = auth.uid() limit 1
  ))
)
with check (
  (empresa_id is not null and empresa_id = public.current_empresa_id())
  or (usuario_id is not null and usuario_id = (
    select id from public.usuarios where auth_user_id = auth.uid() limit 1
  ))
);

grant execute on function public.is_system_admin(uuid) to authenticated;
grant execute on function public.admin_set_empresa_aprovacao(uuid, boolean, text, text) to authenticated;
grant execute on function public.admin_set_empresa_plano(uuid, text, text) to authenticated;
grant execute on function public.admin_set_empresa_status(uuid, text, text) to authenticated;
grant execute on function public.admin_get_empresas_pendentes() to authenticated;
grant execute on function public.admin_get_dashboard() to authenticated;
grant execute on function public.admin_list_empresas(text, text, integer, integer) to authenticated;
grant execute on function public.admin_list_logs(integer, uuid) to authenticated;
grant execute on function public.admin_create_notificacao(text, text, text, uuid, uuid, text) to authenticated;

revoke all on function public.admin_assert_system_admin() from public;

commit;
