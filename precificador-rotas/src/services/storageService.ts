import type { Base, Operacao, CustoGlobal } from '../types';
import { mockBases, mockOperacoes, mockCustosGlobais } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const STORAGE_KEYS = {
  BASES: '@precificador:bases',
  OPERACOES: '@precificador:operacoes',
  CUSTOS_GLOBAIS: '@precificador:custosGlobais'
};

const DEFAULT_CUSTOS_ID = 'default';

let initializationPromise: Promise<void> | null = null;

type BaseRow = {
  id: string;
  codigo: string;
  nome: string;
  endereco: string;
  lat: number | null;
  lng: number | null;
};

type OperacaoRow = {
  id: string;
  nome_operacao: string;
  user_id: string;
  created_at: string;
  data_aprovacao: string | null;
  criado_por: string;
  editado_por: string | null;
  data_edicao: string | null;
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
  status: 'rascunho' | 'aprovada';
};

type CustoGlobalRow = {
  id: string;
  preco_diesel_litro: number;
  custo_motorista_km: number;
  pedagio_medio_km: number;
  data_atualizacao: string;
};

type CsvRow = Record<string, string | number | undefined | null>;

function readLocalStorage<T>(key: string, fallback: T): T {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

function localInitializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.BASES)) {
    localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(mockBases));
  }

  if (!localStorage.getItem(STORAGE_KEYS.OPERACOES)) {
    localStorage.setItem(STORAGE_KEYS.OPERACOES, JSON.stringify(mockOperacoes));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CUSTOS_GLOBAIS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOS_GLOBAIS, JSON.stringify(mockCustosGlobais));
  }
}

function toBaseRow(base: Base): BaseRow {
  return {
    id: base.id,
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

function toOperacaoRow(operacao: Operacao): OperacaoRow {
  return {
    id: operacao.id,
    nome_operacao: operacao.nomeOperacao,
    user_id: operacao.userId,
    created_at: operacao.createdAt,
    data_aprovacao: operacao.dataAprovacao ?? null,
    criado_por: operacao.criadoPor,
    editado_por: operacao.editadoPor ?? null,
    data_edicao: operacao.dataEdicao ?? null,
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
    status: operacao.status
  };
}

function fromOperacaoRow(row: OperacaoRow): Operacao {
  return {
    id: row.id,
    nomeOperacao: row.nome_operacao,
    userId: row.user_id,
    createdAt: row.created_at,
    dataAprovacao: row.data_aprovacao ?? undefined,
    criadoPor: row.criado_por,
    editadoPor: row.editado_por ?? undefined,
    dataEdicao: row.data_edicao ?? undefined,
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
    status: row.status
  };
}

function toCustoGlobalRow(custos: CustoGlobal): CustoGlobalRow {
  return {
    id: DEFAULT_CUSTOS_ID,
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

async function seedSupabaseIfNeeded() {
  if (!supabase) {
    return;
  }

  const [{ count: basesCount, error: basesError }, { count: operacoesCount, error: operacoesError }] = await Promise.all([
    supabase.from('bases').select('id', { count: 'exact', head: true }),
    supabase.from('operacoes').select('id', { count: 'exact', head: true })
  ]);

  if (basesError) {
    throw basesError;
  }

  if (operacoesError) {
    throw operacoesError;
  }

  if (!basesCount) {
    const { error } = await supabase.from('bases').insert(mockBases.map(toBaseRow));
    if (error) {
      throw error;
    }
  }

  if (!operacoesCount) {
    const { error } = await supabase.from('operacoes').insert(mockOperacoes.map(toOperacaoRow));
    if (error) {
      throw error;
    }
  }

  const { data: custosRow, error: custosError } = await supabase
    .from('custos_globais')
    .select('*')
    .eq('id', DEFAULT_CUSTOS_ID)
    .maybeSingle<CustoGlobalRow>();

  if (custosError) {
    throw custosError;
  }

  if (!custosRow) {
    const { error } = await supabase.from('custos_globais').insert(toCustoGlobalRow(mockCustosGlobais));
    if (error) {
      throw error;
    }
  }
}

export function initializeStorage(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      if (!isSupabaseConfigured || !supabase) {
        localInitializeStorage();
        return;
      }

      await seedSupabaseIfNeeded();
    })();
  }

  return initializationPromise;
}

export async function getBases(): Promise<Base[]> {
  await initializeStorage();

  if (!isSupabaseConfigured || !supabase) {
    return readLocalStorage(STORAGE_KEYS.BASES, mockBases);
  }

  const { data, error } = await supabase.from('bases').select('*').order('codigo');
  if (error) {
    throw error;
  }

  return (data as BaseRow[]).map(fromBaseRow);
}

export async function createBase(base: Base): Promise<Base> {
  await initializeStorage();

  if (!isSupabaseConfigured || !supabase) {
    const bases = readLocalStorage<Base[]>(STORAGE_KEYS.BASES, mockBases);
    const nextBases = [...bases, base];
    localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(nextBases));
    return base;
  }

  const { error } = await supabase.from('bases').insert(toBaseRow(base));
  if (error) {
    throw error;
  }

  return base;
}

export async function deleteBase(id: string): Promise<void> {
  await initializeStorage();

  if (!isSupabaseConfigured || !supabase) {
    const bases = readLocalStorage<Base[]>(STORAGE_KEYS.BASES, mockBases).filter((base) => base.id !== id);
    localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(bases));
    return;
  }

  const { error } = await supabase.from('bases').delete().eq('id', id);
  if (error) {
    throw error;
  }
}

export async function importBasesFromCSV(csvData: CsvRow[]): Promise<Base[]> {
  await initializeStorage();

  const bases = parseCsvBases(csvData);

  if (!isSupabaseConfigured || !supabase) {
    const basesExistentes = readLocalStorage<Base[]>(STORAGE_KEYS.BASES, mockBases);
    const novasBases = [...basesExistentes, ...bases];
    localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(novasBases));
    return novasBases;
  }

  if (bases.length > 0) {
    const { error } = await supabase.from('bases').upsert(bases.map(toBaseRow), { onConflict: 'id' });
    if (error) {
      throw error;
    }
  }

  return getBases();
}

export async function getOperacoes(): Promise<Operacao[]> {
  await initializeStorage();

  if (!isSupabaseConfigured || !supabase) {
    return readLocalStorage(STORAGE_KEYS.OPERACOES, mockOperacoes);
  }

  const { data, error } = await supabase.from('operacoes').select('*').order('created_at', { ascending: true });
  if (error) {
    throw error;
  }

  return (data as OperacaoRow[]).map(fromOperacaoRow);
}

export async function saveOperacao(operacao: Operacao): Promise<Operacao> {
  await initializeStorage();

  if (!isSupabaseConfigured || !supabase) {
    const operacoes = readLocalStorage<Operacao[]>(STORAGE_KEYS.OPERACOES, mockOperacoes);
    const index = operacoes.findIndex((op) => op.id === operacao.id);

    if (index >= 0) {
      operacoes[index] = operacao;
    } else {
      operacoes.push(operacao);
    }

    localStorage.setItem(STORAGE_KEYS.OPERACOES, JSON.stringify(operacoes));
    return operacao;
  }

  const { error } = await supabase.from('operacoes').upsert(toOperacaoRow(operacao), { onConflict: 'id' });
  if (error) {
    throw error;
  }

  return operacao;
}

export async function deleteOperacao(id: string): Promise<void> {
  await initializeStorage();

  if (!isSupabaseConfigured || !supabase) {
    const operacoes = readLocalStorage<Operacao[]>(STORAGE_KEYS.OPERACOES, mockOperacoes).filter((op) => op.id !== id);
    localStorage.setItem(STORAGE_KEYS.OPERACOES, JSON.stringify(operacoes));
    return;
  }

  const { error } = await supabase.from('operacoes').delete().eq('id', id);
  if (error) {
    throw error;
  }
}

export async function getCustosGlobais(): Promise<CustoGlobal> {
  await initializeStorage();

  if (!isSupabaseConfigured || !supabase) {
    return readLocalStorage(STORAGE_KEYS.CUSTOS_GLOBAIS, mockCustosGlobais);
  }

  const { data, error } = await supabase
    .from('custos_globais')
    .select('*')
    .eq('id', DEFAULT_CUSTOS_ID)
    .single<CustoGlobalRow>();

  if (error) {
    throw error;
  }

  return fromCustoGlobalRow(data);
}

export async function updateCustosGlobais(custos: Partial<CustoGlobal>): Promise<CustoGlobal> {
  await initializeStorage();

  const custosAtuais = await getCustosGlobais();
  const novosCustos = {
    ...custosAtuais,
    ...custos,
    dataAtualizacao: new Date().toISOString()
  };

  if (!isSupabaseConfigured || !supabase) {
    localStorage.setItem(STORAGE_KEYS.CUSTOS_GLOBAIS, JSON.stringify(novosCustos));
    return novosCustos;
  }

  const { error } = await supabase.from('custos_globais').upsert(toCustoGlobalRow(novosCustos), { onConflict: 'id' });
  if (error) {
    throw error;
  }

  return novosCustos;
}
