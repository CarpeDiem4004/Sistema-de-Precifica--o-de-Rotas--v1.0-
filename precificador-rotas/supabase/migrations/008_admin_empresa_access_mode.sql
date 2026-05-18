begin;

create or replace function public.admin_set_empresa_access_mode(
  p_empresa_id uuid,
  p_modo text,
  p_observacoes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.admin_assert_system_admin();

  if p_modo not in ('ativo', 'suspenso', 'bloqueado') then
    raise exception 'Modo de acesso inválido';
  end if;

  if not exists (select 1 from public.empresas where id = p_empresa_id) then
    raise exception 'Empresa não encontrada';
  end if;

  if p_modo = 'ativo' then
    update public.empresas
    set status = 'ativo'
    where id = p_empresa_id;

    insert into public.empresas_aprovacao (empresa_id, status_aprovacao, aprovado_por, data_aprovacao, observacoes)
    values (p_empresa_id, 'aprovada', auth.uid(), timezone('utc', now()), p_observacoes)
    on conflict (empresa_id)
    do update set
      status_aprovacao = 'aprovada',
      aprovado_por = auth.uid(),
      data_aprovacao = timezone('utc', now()),
      observacoes = excluded.observacoes,
      motivo_reprovacao = null;

    insert into public.notificacoes (empresa_id, titulo, mensagem, tipo)
    values (
      p_empresa_id,
      'Empresa reativada',
      'O acesso da empresa foi reativado e as operações voltaram ao modo normal.',
      'success'
    );

    return true;
  end if;

  if p_modo = 'suspenso' then
    update public.empresas
    set status = 'ativo'
    where id = p_empresa_id;

    insert into public.empresas_aprovacao (empresa_id, status_aprovacao, aprovado_por, data_aprovacao, observacoes)
    values (p_empresa_id, 'suspensa', auth.uid(), timezone('utc', now()), p_observacoes)
    on conflict (empresa_id)
    do update set
      status_aprovacao = 'suspensa',
      aprovado_por = auth.uid(),
      data_aprovacao = timezone('utc', now()),
      observacoes = excluded.observacoes;

    insert into public.notificacoes (empresa_id, titulo, mensagem, tipo)
    values (
      p_empresa_id,
      'Empresa suspensa',
      'O acesso da empresa permanece liberado somente para consulta. Inclusões, alterações e exclusões foram bloqueadas.',
      'warning'
    );

    return true;
  end if;

  update public.empresas
  set status = 'inativo'
  where id = p_empresa_id;

  insert into public.empresas_aprovacao (empresa_id, status_aprovacao, aprovado_por, data_aprovacao, observacoes)
  values (p_empresa_id, 'suspensa', auth.uid(), timezone('utc', now()), p_observacoes)
  on conflict (empresa_id)
  do update set
    status_aprovacao = 'suspensa',
    aprovado_por = auth.uid(),
    data_aprovacao = timezone('utc', now()),
    observacoes = excluded.observacoes;

  insert into public.notificacoes (empresa_id, titulo, mensagem, tipo)
  values (
    p_empresa_id,
    'Empresa bloqueada',
    'O acesso da empresa foi bloqueado completamente até nova liberação do administrador.',
    'error'
  );

  return true;
end;
$$;

grant execute on function public.admin_set_empresa_access_mode(uuid, text, text) to authenticated;

commit;
