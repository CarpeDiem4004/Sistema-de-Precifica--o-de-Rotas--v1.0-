begin;

-- Atualiza a RPC para retornar também a data de aprovação.
-- Necessário para exibir corretamente na aba Empresas.

drop function if exists public.admin_list_empresas(text, text, integer, integer);

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
  status_aprovacao text,
  data_aprovacao timestamptz,
  data_cadastro_formatada text,
  data_aprovacao_formatada text
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
    coalesce(ea.status_aprovacao, 'pendente') as status_aprovacao,
    ea.data_aprovacao,
    to_char(timezone('America/Sao_Paulo', e.criado_em), 'DD/MM/YYYY HH24:MI:SS') as data_cadastro_formatada,
    case
      when ea.data_aprovacao is null then null
      else to_char(timezone('America/Sao_Paulo', ea.data_aprovacao), 'DD/MM/YYYY HH24:MI:SS')
    end as data_aprovacao_formatada
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

grant execute on function public.admin_list_empresas(text, text, integer, integer) to authenticated;

commit;
