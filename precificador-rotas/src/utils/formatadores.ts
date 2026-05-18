export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function formatarMoedaParaCampo(valor: number): string {
  if (!Number.isFinite(valor)) {
    return '';
  }

  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatarMoedaInputBR(valorDigitado: string): string {
  const apenasDigitos = valorDigitado.replace(/\D/g, '');

  if (!apenasDigitos) {
    return '';
  }

  const valor = Number(apenasDigitos) / 100;
  return formatarMoedaParaCampo(valor);
}

export function parseMoedaInputBR(valorFormatado: string): number {
  if (!valorFormatado) {
    return 0;
  }

  const normalizado = valorFormatado
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

export function formatarNumero(valor: number, casasDecimais: number = 2): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais
  });
}

export function formatarQuilometragem(valor: number, casasDecimais: number = 2): string {
  return `${formatarNumero(valor, casasDecimais)} km`;
}

export function formatarPercentual(valor: number): string {
  return `${formatarNumero(valor, 1)}%`;
}

export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}

export function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR');
}
