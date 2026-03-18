export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function formatarNumero(valor: number, casasDecimais: number = 2): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais
  });
}

export function formatarPercentual(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}

export function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR');
}
