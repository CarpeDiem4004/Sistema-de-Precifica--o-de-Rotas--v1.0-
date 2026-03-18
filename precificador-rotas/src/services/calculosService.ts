interface CalculoCustoParams {
  distanciaKm: number;
  custoCombustivel: number;
  custoMotorista: number;
  pedagio: number;
  tipoVeiculo: 'proprio' | 'agregado';
  valorAgregado?: number;
}

interface ResultadoCalculo {
  custoTotal: number;
  custoPorKm: number;
  litrosCombustivel: number;
  custoCombustivel: number;
  custoMotorista: number;
  custoTotalProprio: number;
  custoTotalAgregado: number;
}

export function calcularCustoOperacional(params: CalculoCustoParams): ResultadoCalculo {
  const {
    distanciaKm,
    custoCombustivel,
    custoMotorista,
    pedagio,
    tipoVeiculo,
    valorAgregado = 0
  } = params;

  const litrosCombustivel = 0;
  
  const custoTotalProprio = custoCombustivel + custoMotorista + pedagio;
  const custoTotalAgregado = valorAgregado + pedagio;
  
  const custoTotal = tipoVeiculo === 'proprio' ? custoTotalProprio : custoTotalAgregado;
  const custoPorKm = distanciaKm > 0 ? custoTotal / distanciaKm : 0;

  return {
    custoTotal,
    custoPorKm,
    litrosCombustivel,
    custoCombustivel,
    custoMotorista,
    custoTotalProprio,
    custoTotalAgregado
  };
}

export function calcularMargem(custoTotal: number, valorVenda: number): {
  lucro: number;
  margemPercent: number;
} {
  const lucro = valorVenda - custoTotal;
  const margemPercent = (lucro / valorVenda) * 100;
  
  return { lucro, margemPercent };
}

export function calcularValorVendaPorMargem(
  custoTotal: number, 
  margemDesejadaPercent: number
): number {
  if (margemDesejadaPercent >= 100) return 0;
  return custoTotal / (1 - (margemDesejadaPercent / 100));
}

export function validarMargem(margemPercent: number): 'success' | 'warning' | 'danger' {
  if (margemPercent >= 15) return 'success';
  if (margemPercent >= 8) return 'warning';
  return 'danger';
}
