export function validarCampoObrigatorio(valor: string | number | undefined): boolean {
  if (valor === undefined || valor === null) return false;
  if (typeof valor === 'string') return valor.trim().length > 0;
  return true;
}

export function validarNumeroPositivo(valor: number): boolean {
  return !isNaN(valor) && valor > 0;
}

export function validarConsumo(consumoKmL: number): boolean {
  return consumoKmL > 0 && consumoKmL <= 20;
}

export function validarMargem(margemPercent: number): boolean {
  return margemPercent > -100 && margemPercent < 100;
}
