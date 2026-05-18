import type { Base, CustoGlobal, HistoricoAlteracaoOperacao, Operacao } from '../types';
import { mockBases, mockCustosGlobais, mockOperacoes } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const STORAGE_KEYS = {
  BASES: '@precificador:bases',
  OPERACOES: '@precificador:operacoes',
  CUSTOS_GLOBAIS: '@precificador:custosGlobais',
  OPERACOES_HISTORICO: '@precificador:operacoesHistorico',
  OPERACOES_ATIVO: '@precificador:operacoesAtivo'
};

export type CsvRow = Record<string, string | number | undefined | null>;

type TenantScope = {
  empresaId: string;
  usuarioId?: string;
  usuarioNome?: string;
};

type BaseRow = {
  id: string;
  empresa_id: string;
  codigo: string;
  nome: string;
  endereco: string;
  lat: number | null;
  lng: number | null;
};

type OperacaoRow = {
  id: string;
  empresa_id: string;
  usuario_id: string;
  ativo?: boolean;
  nome_operacao: string;
  criado_por: string;
  editado_por: string | null;
  codigo_origem: string;
  codigo_destino: string;
  endereco_origem: string | null;
  endereco_destino: string | null;
  distancia_km: number;
  tempo_estimado: string | null;
  tipo_veiculo: 'proprio' | 'agregado';
  valor_agregado: number | null;
  custo_diesel_litro_original: number;
  consumo_km_l: number;
  custo_combustivel_original: number;
  custo_motorista_original: number;
  pedagio: number;
  outros_custos: number;
  valor_cliente: number | null;
  valor_venda: number;
  custo_total_original: number;
  lucro_original: number;
  margem_original_percent: number;
  margem_atual_percent: number | null;
  lucro_atual: number | null;
  historico_alteracoes?: HistoricoAlteracaoOperacao[] | string | null;
  status: 'rascunho' | 'aprovada';
  data_aprovacao: string | null;
  criado_em: string;
  atualizado_em: string;
};

type CustoGlobalRow = {
  empresa_id: string;
  preco_diesel_litro: number;
  custo_motorista_km: number;
  pedagio_medio_km: number;
  data_atualizacao: string;
};

function getStorageKey(baseKey: string, empresaId: string) {
  return `${baseKey}:${empresaId}`;
}

function readLocalStorage<T>(key: string, fallback: T): T {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

function writeLocalStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initializeLocalStorage(empresaId: string) {
  const basesKey = getStorageKey(STORAGE_KEYS.BASES, empresaId);
  const operacoesKey = getStorageKey(STORAGE_KEYS.OPERACOES, empresaId);
  const custosKey = getStorageKey(STORAGE_KEYS.CUSTOS_GLOBAIS, empresaId);
  const historicoKey = getStorageKey(STORAGE_KEYS.OPERACOES_HISTORICO, empresaId);
  const ativoKey = getStorageKey(STORAGE_KEYS.OPERACOES_ATIVO, empresaId);

  if (!localStorage.getItem(basesKey)) {
    writeLocalStorage(basesKey, mockBases);
  }

  if (!localStorage.getItem(operacoesKey)) {
    writeLocalStorage(operacoesKey, mockOperacoes);
  }

  if (!localStorage.getItem(custosKey)) {
    writeLocalStorage(custosKey, mockCustosGlobais);
  }

  if (!localStorage.getItem(historicoKey)) {
    writeLocalStorage<Record<string, HistoricoAlteracaoOperacao[]>>(historicoKey, {});
  }

  if (!localStorage.getItem(ativoKey)) {
    writeLocalStorage<Record<string, boolean>>(ativoKey, {});
  }
}

function readOperacoesHistorico(empresaId: string) {
  return readLocalStorage<Record<string, HistoricoAlteracaoOperacao[]>>(
    getStorageKey(STORAGE_KEYS.OPERACOES_HISTORICO, empresaId),
    {}
  );
}

function writeOperacoesHistorico(empresaId: string, historico: Record<string, HistoricoAlteracaoOperacao[]>) {
  writeLocalStorage(getStorageKey(STORAGE_KEYS.OPERACOES_HISTORICO, empresaId), historico);
}

function persistirHistoricoOperacao(empresaId: string, operacaoId: string, historico?: HistoricoAlteracaoOperacao[]) {
  if (!historico) {
    return;
  }

  const historicos = readOperacoesHistorico(empresaId);
  historicos[operacaoId] = historico;
  writeOperacoesHistorico(empresaId, historicos);
}

function readOperacoesAtivo(empresaId: string) {
  return readLocalStorage<Record<string, boolean>>(
    getStorageKey(STORAGE_KEYS.OPERACOES_ATIVO, empresaId),
    {}
  );
}

function writeOperacoesAtivo(empresaId: string, ativos: Record<string, boolean>) {
  writeLocalStorage(getStorageKey(STORAGE_KEYS.OPERACOES_ATIVO, empresaId), ativos);
}

function persistirAtivoOperacao(empresaId: string, operacaoId: string, ativo: boolean | undefined) {
  const ativos = readOperacoesAtivo(empresaId);
  ativos[operacaoId] = ativo !== false;
  writeOperacoesAtivo(empresaId, ativos);
}

function aplicarHistoricoOperacoes(empresaId: string, operacoes: Operacao[]) {
  const historicos = readOperacoesHistorico(empresaId);
  const ativos = readOperacoesAtivo(empresaId);

  return operacoes.map((operacao) => ({
    ...operacao,
    ativo: typeof operacao.ativo === 'boolean' ? operacao.ativo : (ativos[operacao.id] ?? true),
    historicoAlteracoes: operacao.historicoAlteracoes ?? historicos[operacao.id] ?? []
  }));
}

export async function initializeStorage(empresaId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    initializeLocalStorage(empresaId);
  }
}

function toBaseRow(scope: TenantScope, base: Base): BaseRow {
  return {
    id: base.id,
    empresa_id: scope.empresaId,
    codigo: base.codigo,
    nome: base.nome,
    endereco: base.endereco,
    lat: base.lat ?? null,
    lng: base.lng ?? null
  };
}

function fromBaseRow(row: BaseRow): Base {
  return {
    id: row.id,
    codigo: row.codigo,
    nome: row.nome,
    endereco: row.endereco,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined
  };
}

function toOperacaoRow(
  scope: Required<Pick<TenantScope, 'empresaId' | 'usuarioId'>> & Pick<TenantScope, 'usuarioNome'>,
  operacao: Operacao,
  options?: {
    includeHistory?: boolean;
    includeAtivo?: boolean;
  }
): OperacaoRow {
  const includeHistory = options?.includeHistory ?? true;
  const includeAtivo = options?.includeAtivo ?? true;

  return {
    id: operacao.id,
    empresa_id: scope.empresaId,
    usuario_id: scope.usuarioId,
    ...(includeAtivo ? { ativo: operacao.ativo !== false } : {}),
    nome_operacao: operacao.nomeOperacao,
    criado_por: operacao.criadoPor || scope.usuarioNome || 'Usuário',
    editado_por: operacao.editadoPor ?? scope.usuarioNome ?? null,
    codigo_origem: operacao.codigoOrigem,
    codigo_destino: operacao.codigoDestino,
    endereco_origem: operacao.enderecoOrigem ?? null,
    endereco_destino: operacao.enderecoDestino ?? null,
    distancia_km: operacao.distanciaKm,
    tempo_estimado: operacao.tempoEstimado ?? null,
    tipo_veiculo: operacao.tipoVeiculo,
    valor_agregado: operacao.valorAgregado ?? null,
    custo_diesel_litro_original: operacao.custoDieselLitroOriginal,
    consumo_km_l: operacao.consumoKmL,
    custo_combustivel_original: operacao.custoCombustivelOriginal,
    custo_motorista_original: operacao.custoMotoristaOriginal,
    pedagio: operacao.pedagio,
    outros_custos: operacao.outrosCustos,
    valor_cliente: operacao.valorCliente ?? null,
    valor_venda: operacao.valorVenda,
    custo_total_original: operacao.custoTotalOriginal,
    lucro_original: operacao.lucroOriginal,
    margem_original_percent: operacao.margemOriginalPercent,
    margem_atual_percent: operacao.margemAtualPercent ?? null,
    lucro_atual: operacao.lucroAtual ?? null,
    ...(includeHistory ? { historico_alteracoes: operacao.historicoAlteracoes ?? [] } : {}),
    status: operacao.status,
    data_aprovacao: operacao.dataAprovacao ?? null,
    criado_em: operacao.createdAt,
    atualizado_em: operacao.dataEdicao ?? operacao.createdAt
  };
}

function parseHistoricoAlteracoes(valor: OperacaoRow['historico_alteracoes']): HistoricoAlteracaoOperacao[] {
  if (!valor) {
    return [];
  }

  if (Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor === 'string') {
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function fromOperacaoRow(row: OperacaoRow): Operacao {
  return {
    id: row.id,
    nomeOperacao: row.nome_operacao,
    ativo: row.ativo,
    userId: row.usuario_id,
    createdAt: row.criado_em,
    dataAprovacao: row.data_aprovacao ?? undefined,
    criadoPor: row.criado_por,
    editadoPor: row.editado_por ?? undefined,
    dataEdicao: row.atualizado_em,
    codigoOrigem: row.codigo_origem,
    codigoDestino: row.codigo_destino,
    enderecoOrigem: row.endereco_origem ?? undefined,
    enderecoDestino: row.endereco_destino ?? undefined,
    distanciaKm: row.distancia_km,
    tempoEstimado: row.tempo_estimado ?? undefined,
    tipoVeiculo: row.tipo_veiculo,
    valorAgregado: row.valor_agregado ?? undefined,
    custoDieselLitroOriginal: row.custo_diesel_litro_original,
    consumoKmL: row.consumo_km_l,
    custoCombustivelOriginal: row.custo_combustivel_original,
    custoMotoristaOriginal: row.custo_motorista_original,
    pedagio: row.pedagio,
    outrosCustos: row.outros_custos,
    valorCliente: row.valor_cliente ?? undefined,
    valorVenda: row.valor_venda,
    custoTotalOriginal: row.custo_total_original,
    lucroOriginal: row.lucro_original,
    margemOriginalPercent: row.margem_original_percent,
    margemAtualPercent: row.margem_atual_percent ?? undefined,
    lucroAtual: row.lucro_atual ?? undefined,
    historicoAlteracoes: parseHistoricoAlteracoes(row.historico_alteracoes),
    status: row.status
  };
}

function toCustoGlobalRow(empresaId: string, custos: CustoGlobal): CustoGlobalRow {
  return {
    empresa_id: empresaId,
    preco_diesel_litro: custos.precoDieselLitro,
    custo_motorista_km: custos.custoMotoristaKm,
    pedagio_medio_km: custos.pedagioMedioKm,
    data_atualizacao: custos.dataAtualizacao
  };
}

function fromCustoGlobalRow(row: CustoGlobalRow): CustoGlobal {
  return {
    precoDieselLitro: row.preco_diesel_litro,
    custoMotoristaKm: row.custo_motorista_km,
    pedagioMedioKm: row.pedagio_medio_km,
    dataAtualizacao: row.data_atualizacao
  };
}

function parseCsvBases(csvData: CsvRow[]): Base[] {
  return csvData
    .map((row, index) => ({
      id: `base_${Date.now()}_${index}`,
      codigo: String(row.codigo || row['Código'] || row.CODIGO || '').trim().toUpperCase(),
      nome: String(row.nome || row.Nome || row.NOME || '').trim(),
      endereco: String(row.endereco || row['Endereço'] || row.ENDERECO || '').trim(),
      lat: row.lat ? Number(row.lat) : undefined,
      lng: row.lng ? Number(row.lng) : undefined
    }))
    .filter((base) => base.codigo && base.endereco);
}

export async function getBases(empresaId: string): Promise<Base[]> {
  await initializeStorage(empresaId);

  if (!isSupabaseConfigured || !supabase) {
    return readLocalStorage(getStorageKey(STORAGE_KEYS.BASES, empresaId), mockBases);
  }

  const { data, error } = await supabase
    .from('bases')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('codigo');

  if (error) {
    throw error;
  }

  return (data as BaseRow[]).map(fromBaseRow);
}

export async function createBase(empresaId: string, base: Base): Promise<Base> {
  await initializeStorage(empresaId);

  if (!isSupabaseConfigured || !supabase) {
    const key = getStorageKey(STORAGE_KEYS.BASES, empresaId);
    const bases = readLocalStorage<Base[]>(key, mockBases);
    writeLocalStorage(key, [...bases, base]);
    return base;
  }

  const { error } = await supabase.from('bases').insert(toBaseRow({ empresaId }, base));
  if (error) {
    throw error;
  }

  return base;
}

export async function deleteBase(empresaId: string, id: string): Promise<void> {
  await initializeStorage(empresaId);

  if (!isSupabaseConfigured || !supabase) {
    const key = getStorageKey(STORAGE_KEYS.BASES, empresaId);
    const bases = readLocalStorage<Base[]>(key, mockBases).filter((base) => base.id !== id);
    writeLocalStorage(key, bases);
    return;
  }

  const { error } = await supabase.from('bases').delete().eq('empresa_id', empresaId).eq('id', id);
  if (error) {
    throw error;
  }
}

export async function importBasesFromCSV(empresaId: string, csvData: CsvRow[]): Promise<Base[]> {
  await initializeStorage(empresaId);
  const bases = parseCsvBases(csvData);

  if (!isSupabaseConfigured || !supabase) {
    const key = getStorageKey(STORAGE_KEYS.BASES, empresaId);
    const basesExistentes = readLocalStorage<Base[]>(key, mockBases);
    const novasBases = [...basesExistentes, ...bases];
    writeLocalStorage(key, novasBases);
    return novasBases;
  }

  if (bases.length > 0) {
    const { error } = await supabase
      .from('bases')
      .upsert(bases.map((base) => toBaseRow({ empresaId }, base)), { onConflict: 'empresa_id,codigo' });

    if (error) {
      throw error;
    }
  }

  return getBases(empresaId);
}

export async function getOperacoes(empresaId: string): Promise<Operacao[]> {
  await initializeStorage(empresaId);

  if (!isSupabaseConfigured || !supabase) {
    return aplicarHistoricoOperacoes(
      empresaId,
      readLocalStorage(getStorageKey(STORAGE_KEYS.OPERACOES, empresaId), mockOperacoes)
    );
  }

  const { data, error } = await supabase
    .from('operacoes')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('criado_em', { ascending: true });

  if (error) {
    throw error;
  }

  return aplicarHistoricoOperacoes(empresaId, (data as OperacaoRow[]).map(fromOperacaoRow));
}

export async function saveOperacao(scope: Required<Pick<TenantScope, 'empresaId' | 'usuarioId'>> & Pick<TenantScope, 'usuarioNome'>, operacao: Operacao): Promise<Operacao> {
  await initializeStorage(scope.empresaId);

  if (!isSupabaseConfigured || !supabase) {
    const key = getStorageKey(STORAGE_KEYS.OPERACOES, scope.empresaId);
    const operacoes = readLocalStorage<Operacao[]>(key, mockOperacoes);
    const index = operacoes.findIndex((item) => item.id === operacao.id);

    if (index >= 0) {
      operacoes[index] = operacao;
    } else {
      operacoes.push(operacao);
    }

    writeLocalStorage(key, operacoes);
    persistirHistoricoOperacao(scope.empresaId, operacao.id, operacao.historicoAlteracoes);
    persistirAtivoOperacao(scope.empresaId, operacao.id, operacao.ativo);
    return operacao;
  }

  let error = null;
  let includeHistory = true;
  let includeAtivo = true;

  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const attempt = await supabase
      .from('operacoes')
      .upsert(toOperacaoRow(scope, operacao, { includeHistory, includeAtivo }), { onConflict: 'id' });

    error = attempt.error;

    if (!error) {
      break;
    }

    const errorMessage = error.message.toLowerCase();
    let retry = false;

    if (includeHistory && errorMessage.includes('historico_alteracoes')) {
      includeHistory = false;
      retry = true;
    }

    if (includeAtivo && errorMessage.includes('ativo')) {
      includeAtivo = false;
      retry = true;
    }

    if (!retry) {
      break;
    }
  }

  if (error) {
    throw error;
  }

  persistirHistoricoOperacao(scope.empresaId, operacao.id, operacao.historicoAlteracoes);
  persistirAtivoOperacao(scope.empresaId, operacao.id, operacao.ativo);
  return operacao;
}

export async function deleteOperacao(empresaId: string, id: string): Promise<void> {
  await initializeStorage(empresaId);

  if (!isSupabaseConfigured || !supabase) {
    const key = getStorageKey(STORAGE_KEYS.OPERACOES, empresaId);
    const operacoes = readLocalStorage<Operacao[]>(key, mockOperacoes).filter((item) => item.id !== id);
    writeLocalStorage(key, operacoes);

    const historicos = readOperacoesHistorico(empresaId);
    delete historicos[id];
    writeOperacoesHistorico(empresaId, historicos);

    const ativos = readOperacoesAtivo(empresaId);
    delete ativos[id];
    writeOperacoesAtivo(empresaId, ativos);
    return;
  }

  const { error } = await supabase.from('operacoes').delete().eq('empresa_id', empresaId).eq('id', id);
  if (error) {
    throw error;
  }

  const historicos = readOperacoesHistorico(empresaId);
  delete historicos[id];
  writeOperacoesHistorico(empresaId, historicos);

  const ativos = readOperacoesAtivo(empresaId);
  delete ativos[id];
  writeOperacoesAtivo(empresaId, ativos);
}

export async function getCustosGlobais(empresaId: string): Promise<CustoGlobal> {
  await initializeStorage(empresaId);

  if (!isSupabaseConfigured || !supabase) {
    return readLocalStorage(getStorageKey(STORAGE_KEYS.CUSTOS_GLOBAIS, empresaId), mockCustosGlobais);
  }

  const { data, error } = await supabase
    .from('custos_globais')
    .select('*')
    .eq('empresa_id', empresaId)
    .single();

  if (error) {
    throw error;
  }

  return fromCustoGlobalRow(data as CustoGlobalRow);
}

export async function updateCustosGlobais(empresaId: string, custos: Partial<CustoGlobal>): Promise<CustoGlobal> {
  await initializeStorage(empresaId);

  const atuais = await getCustosGlobais(empresaId);
  const novosCustos = {
    ...atuais,
    ...custos,
    dataAtualizacao: new Date().toISOString()
  };

  if (!isSupabaseConfigured || !supabase) {
    writeLocalStorage(getStorageKey(STORAGE_KEYS.CUSTOS_GLOBAIS, empresaId), novosCustos);
    return novosCustos;
  }

  const { error } = await supabase
    .from('custos_globais')
    .upsert(toCustoGlobalRow(empresaId, novosCustos), { onConflict: 'empresa_id' });

  if (error) {
    throw error;
  }

  return novosCustos;
}
