import type { Base, Operacao, CustoGlobal } from '../types';
import { mockBases, mockOperacoes, mockCustosGlobais } from '../data/mockData';

const STORAGE_KEYS = {
  BASES: '@precificador:bases',
  OPERACOES: '@precificador:operacoes',
  CUSTOS_GLOBAIS: '@precificador:custosGlobais'
};

// Inicializa o localStorage com dados mock
export function initializeStorage() {
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

// Bases
export function getBases(): Base[] {
  const data = localStorage.getItem(STORAGE_KEYS.BASES);
  return data ? JSON.parse(data) : [];
}

export function saveBases(bases: Base[]): void {
  localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(bases));
}

export function importBasesFromCSV(csvData: any[]): Base[] {
  const bases: Base[] = csvData.map((row, index) => ({
    id: `base_${Date.now()}_${index}`,
    codigo: row.codigo || row['Código'] || row.CODIGO || '',
    nome: row.nome || row.Nome || row.NOME || '',
    endereco: row.endereco || row['Endereço'] || row.ENDERECO || '',
    lat: row.lat ? Number(row.lat) : undefined,
    lng: row.lng ? Number(row.lng) : undefined
  })).filter(base => base.codigo && base.endereco);
  
  const basesExistentes = getBases();
  const novasBases = [...basesExistentes, ...bases];
  saveBases(novasBases);
  
  return novasBases;
}

// Operações
export function getOperacoes(): Operacao[] {
  const data = localStorage.getItem(STORAGE_KEYS.OPERACOES);
  return data ? JSON.parse(data) : [];
}

export function saveOperacao(operacao: Operacao): Operacao[] {
  const operacoes = getOperacoes();
  const index = operacoes.findIndex(op => op.id === operacao.id);
  
  if (index >= 0) {
    operacoes[index] = operacao;
  } else {
    operacoes.push(operacao);
  }
  
  localStorage.setItem(STORAGE_KEYS.OPERACOES, JSON.stringify(operacoes));
  return operacoes;
}

export function deleteOperacao(id: string): Operacao[] {
  const operacoes = getOperacoes().filter(op => op.id !== id);
  localStorage.setItem(STORAGE_KEYS.OPERACOES, JSON.stringify(operacoes));
  return operacoes;
}

// Custos Globais
export function getCustosGlobais(): CustoGlobal {
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOS_GLOBAIS);
  return data ? JSON.parse(data) : mockCustosGlobais;
}

export function updateCustosGlobais(custos: Partial<CustoGlobal>): CustoGlobal {
  const custosAtuais = getCustosGlobais();
  const novosCustos = {
    ...custosAtuais,
    ...custos,
    dataAtualizacao: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEYS.CUSTOS_GLOBAIS, JSON.stringify(novosCustos));
  return novosCustos;
}
