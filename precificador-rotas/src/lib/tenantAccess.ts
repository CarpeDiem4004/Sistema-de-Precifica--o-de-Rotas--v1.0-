export type EmpresaStatus = 'ativo' | 'inativo' | 'trial';
export type EmpresaAprovacaoStatus = 'pendente' | 'aprovada' | 'reprovada' | 'suspensa';
export type TenantAccessMode = 'full' | 'read-only' | 'blocked';

type AccessInput = {
  status?: string | null;
  statusAprovacao?: string | null;
  isSystemAdmin?: boolean;
};

export function getTenantAccessMode({ status, statusAprovacao, isSystemAdmin = false }: AccessInput): TenantAccessMode {
  if (isSystemAdmin) {
    return 'full';
  }

  if (status === 'inativo') {
    return 'blocked';
  }

  if (statusAprovacao === 'suspensa') {
    return 'read-only';
  }

  return 'full';
}

export function getTenantAccessLabel(accessMode: TenantAccessMode) {
  switch (accessMode) {
    case 'blocked':
      return 'Bloqueado';
    case 'read-only':
      return 'Suspenso';
    default:
      return 'Ativo';
  }
}

export function getTenantAccessMessage(accessMode: TenantAccessMode) {
  switch (accessMode) {
    case 'blocked':
      return 'O acesso desta empresa foi bloqueado. Entre em contato com o administrador da plataforma.';
    case 'read-only':
      return 'A empresa está suspensa. O acesso continua liberado apenas para consulta, sem criar, editar ou excluir dados.';
    default:
      return '';
  }
}