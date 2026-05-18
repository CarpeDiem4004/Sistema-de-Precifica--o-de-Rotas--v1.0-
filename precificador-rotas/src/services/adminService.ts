import { supabase } from '../lib/supabase';

export type DashboardData = {
  total_empresas: number;
  empresas_ativas: number;
  empresas_trial: number;
  empresas_pendentes: number;
  total_usuarios: number;
  total_operacoes: number;
  faturamento_mensal: number;
};

export type EmpresaPendente = {
  empresa_id: string;
  slug: string;
  nome_fantasia: string;
  email_contato: string;
  telefone: string | null;
  data_cadastro: string;
  status_aprovacao: 'pendente' | 'aprovada' | 'reprovada' | 'suspensa';
  dias_pendente: number;
};

export type EmpresaAdmin = {
  id: string;
  slug: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string | null;
  email_contato: string;
  telefone: string | null;
  plano: 'trial' | 'basico' | 'profissional' | 'enterprise';
  status: 'ativo' | 'inativo' | 'trial';
  data_ativacao: string;
  data_expiracao: string | null;
  criado_em: string;
  status_aprovacao: 'pendente' | 'aprovada' | 'reprovada' | 'suspensa';
  data_aprovacao?: string | null;
  data_cadastro_formatada?: string | null;
  data_aprovacao_formatada?: string | null;
};

export type EmpresaAccessAction = 'ativo' | 'suspenso' | 'bloqueado';

export type LogAcessoAdmin = {
  id: string;
  criado_em: string;
  acao: string;
  ip: string | null;
  user_agent: string | null;
  empresa_id: string | null;
  empresa_nome: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  usuario_email: string | null;
};

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase não configurado.');
  }

  return supabase;
}

function getRpcFirstRow<T>(data: unknown): T {
  if (Array.isArray(data)) {
    return (data[0] ?? null) as T;
  }

  return data as T;
}

export async function checkSystemAdmin(userId?: string) {
  const client = ensureClient();
  const params = userId ? { p_user_id: userId } : undefined;
  const { data, error } = await client.rpc('is_system_admin', params);

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function getAdminDashboard() {
  const client = ensureClient();
  const { data, error } = await client.rpc('admin_get_dashboard');

  if (error) {
    throw error;
  }

  return getRpcFirstRow<DashboardData>(data);
}

export async function getEmpresasPendentes() {
  const client = ensureClient();
  const { data, error } = await client.rpc('admin_get_empresas_pendentes');

  if (error) {
    throw error;
  }

  return (data ?? []) as EmpresaPendente[];
}

export async function listEmpresas(search = '', status = 'todos') {
  const client = ensureClient();
  const normalizedSearch = search.trim();
  const normalizedStatus = status === 'todos' ? null : status;
  const { data, error } = await client.rpc('admin_list_empresas', {
    p_search: normalizedSearch.length ? normalizedSearch : null,
    p_status: normalizedStatus,
    p_limit: 500,
    p_offset: 0
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as EmpresaAdmin[];
}

export async function aprovarEmpresa(empresaId: string, aprovado: boolean, motivo?: string, observacoes?: string) {
  const client = ensureClient();
  const { data, error } = await client.rpc('admin_set_empresa_aprovacao', {
    p_empresa_id: empresaId,
    p_aprovado: aprovado,
    p_motivo: motivo ?? null,
    p_observacoes: observacoes ?? null
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function alterarPlano(empresaId: string, novoPlano: EmpresaAdmin['plano'], motivo?: string) {
  const client = ensureClient();
  const { data, error } = await client.rpc('admin_set_empresa_plano', {
    p_empresa_id: empresaId,
    p_novo_plano: novoPlano,
    p_motivo: motivo ?? null
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function alterarStatusEmpresa(empresaId: string, novoStatus: EmpresaAdmin['status'], observacoes?: string) {
  const client = ensureClient();
  const { data, error } = await client.rpc('admin_set_empresa_status', {
    p_empresa_id: empresaId,
    p_status: novoStatus,
    p_observacoes: observacoes ?? null
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function alterarModoAcessoEmpresa(empresaId: string, modo: EmpresaAccessAction, observacoes?: string) {
  const client = ensureClient();
  const { data, error } = await client.rpc('admin_set_empresa_access_mode', {
    p_empresa_id: empresaId,
    p_modo: modo,
    p_observacoes: observacoes ?? null
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function listLogs(limit = 250, empresaId?: string) {
  const client = ensureClient();
  const { data, error } = await client.rpc('admin_list_logs', {
    p_limit: limit,
    p_empresa_id: empresaId ?? null
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as LogAcessoAdmin[];
}

export async function criarNotificacao(payload: {
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  empresaId?: string;
  usuarioId?: string;
  link?: string;
}) {
  const client = ensureClient();
  const { data, error } = await client.rpc('admin_create_notificacao', {
    p_titulo: payload.titulo,
    p_mensagem: payload.mensagem,
    p_tipo: payload.tipo,
    p_empresa_id: payload.empresaId ?? null,
    p_usuario_id: payload.usuarioId ?? null,
    p_link: payload.link ?? null
  });

  if (error) {
    throw error;
  }

  return data as string;
}
