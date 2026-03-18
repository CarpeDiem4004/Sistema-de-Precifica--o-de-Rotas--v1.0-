import { useState } from 'react';
import type { CustoGlobal } from '../types';
import { getCustosGlobais, updateCustosGlobais } from '../services/storageService';

export function useCustosGlobais() {
  const [custos, setCustos] = useState<CustoGlobal>(getCustosGlobais());

  const atualizarCustos = (novosCustos: Partial<CustoGlobal>) => {
    const atualizados = updateCustosGlobais(novosCustos);
    setCustos(atualizados);
    return atualizados;
  };

  return {
    custos,
    atualizarCustos
  };
}
