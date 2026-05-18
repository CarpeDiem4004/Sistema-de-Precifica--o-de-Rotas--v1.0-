import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type UsuarioEmpresa = {
  id: string;
  nome: string;
  email: string;
  cargo: 'admin' | 'operador' | 'visualizador';
  status: 'ativo' | 'inativo';
  ultimo_acesso?: string | null;
  criado_em?: string;
};

export type ConviteEmpresa = {
  id: string;
  email: string;
  cargo: 'admin' | 'operador' | 'visualizador';
  token: string;
  expira_em: string;
  criado_em: string;
  usado_em?: string | null;
};

export type ConvitePublico = {
  email: string;
  cargo: 'admin' | 'operador' | 'visualizador';
  empresa_slug: string;
  empresa_nome: string;
  expira_em: string;
  usado_em?: string | null;
  expirado: boolean;
};

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado.');
  }

  return supabase;
}

export async function getUsuariosEmpresa() {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('usuarios')
    .select('id, nome, email, cargo, status, ultimo_acesso, criado_em')
    .order('nome');

  if (error) {
    throw error;
  }

  return (data ?? []) as UsuarioEmpresa[];
}

export async function getConvitesEmpresa() {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('convites')
    .select('id, email, cargo, token, expira_em, criado_em, usado_em')
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ConviteEmpresa[];
}

export async function createConvite(email: string, cargo: ConviteEmpresa['cargo'], redirectBase?: string) {
  const client = ensureSupabase();
  const { data, error } = await client.rpc('create_convite', {
    p_email: email,
    p_cargo: cargo,
    p_redirect_base: redirectBase ?? null
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}

export async function revokeConvite(inviteId: string) {
  const client = ensureSupabase();
  const { error } = await client.rpc('revoke_convite', {
    p_invite_id: inviteId
  });

  if (error) {
    throw error;
  }
}

export async function getConvitePublico(token: string) {
  const client = ensureSupabase();
  const { data, error } = await client.rpc('get_convite_publico', {
    p_token: token
  });

  if (error) {
    throw error;
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  return data[0] as ConvitePublico;
}
