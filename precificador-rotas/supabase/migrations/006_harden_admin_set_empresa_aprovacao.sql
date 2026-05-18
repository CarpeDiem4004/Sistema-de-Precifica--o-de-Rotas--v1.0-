begin;

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

  begin
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
  exception
    when others then
      -- Notificação é secundária; não deve quebrar o fluxo de aprovação.
      null;
  end;

  return true;
end;
$$;

commit;
