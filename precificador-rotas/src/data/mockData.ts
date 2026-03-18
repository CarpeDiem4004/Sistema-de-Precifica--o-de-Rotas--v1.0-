import type { Base, Operacao, CustoGlobal } from '../types';

export const mockBases: Base[] = [
  {
    id: '1',
    codigo: 'SP001',
    nome: 'Base São Paulo - Zona Sul',
    endereco: 'Av. Robert Kennedy, 1000 - São Paulo, SP',
    lat: -23.6545,
    lng: -46.7118
  },
  {
    id: '2',
    codigo: 'SP002',
    nome: 'Base São Paulo - Zona Norte',
    endereco: 'Av. Inajar de Souza, 500 - São Paulo, SP',
    lat: -23.4827,
    lng: -46.6302
  },
  {
    id: '3',
    codigo: 'RJ001',
    nome: 'Base Rio de Janeiro - Centro',
    endereco: 'Av. Presidente Vargas, 1000 - Rio de Janeiro, RJ',
    lat: -22.9035,
    lng: -43.1765
  },
  {
    id: '4',
    codigo: 'MG001',
    nome: 'Base Belo Horizonte',
    endereco: 'Av. Amazonas, 2000 - Belo Horizonte, MG',
    lat: -19.9167,
    lng: -43.9345
  }
];

export const mockCustosGlobais: CustoGlobal = {
  precoDieselLitro: 5.89,
  custoMotoristaKm: 0.85,
  pedagioMedioKm: 0.32,
  dataAtualizacao: new Date().toISOString()
};

export const mockOperacoes: Operacao[] = [
  {
    id: '1',
    nomeOperacao: 'SP-RJ - Cliente ABC - Março/2026',
    userId: 'user1',
    createdAt: '2026-03-15T10:30:00',
    criadoPor: 'João Paulo',
    dataAprovacao: '2026-03-15T10:35:00',
    codigoOrigem: 'SP001',
    codigoDestino: 'RJ001',
    distanciaKm: 438,
    tipoVeiculo: 'proprio',
    custoDieselLitroOriginal: 5.89,
    consumoKmL: 2.8,
    custoCombustivelOriginal: 921.32,
    custoMotoristaOriginal: 0.85,
    pedagio: 184.50,
    outrosCustos: 150,
    valorVenda: 2500,
    custoTotalOriginal: 1823.75,
    lucroOriginal: 676.25,
    margemOriginalPercent: 27.05,
    margemAtualPercent: 24.8,
    lucroAtual: 620,
    status: 'aprovada'
  }
];
