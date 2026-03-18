export interface Base {
  id: string;
  codigo: string;
  nome: string;
  endereco: string;
  lat?: number;
  lng?: number;
}

export interface CustoGlobal {
  precoDieselLitro: number;
  custoMotoristaKm: number;
  pedagioMedioKm: number;
  dataAtualizacao: string;
}

export interface Operacao {
  id: string;
  nomeOperacao: string;
  userId: string;
  createdAt: string;
  dataAprovacao?: string;
  criadoPor: string;
  editadoPor?: string;
  dataEdicao?: string;
  codigoOrigem: string;
  codigoDestino: string;
  enderecoOrigem?: string;
  enderecoDestino?: string;
  distanciaKm: number;
  tempoEstimado?: string;
  
  // Tipo de veículo
  tipoVeiculo: 'proprio' | 'agregado';
  valorAgregado?: number; // valor repassado ao agregado
  
  // Custos originais
  custoDieselLitroOriginal: number;
  consumoKmL: number;
  custoCombustivelOriginal: number;
  custoMotoristaOriginal: number;
  pedagio: number;
  outrosCustos: number;
  
  // Valores comerciais
  valorCliente?: number;
  valorVenda: number;
  
  // Resultados originais
  custoTotalOriginal: number;
  lucroOriginal: number;
  margemOriginalPercent: number;
  
  // Resultados atuais (para monitoramento)
  margemAtualPercent?: number;
  lucroAtual?: number;
  
  status: 'rascunho' | 'aprovada';
}

export interface DistanceMatrixResponse {
  distancia: number; // em km
  duracao: string; // texto formatado
  duracaoSegundos: number;
}
