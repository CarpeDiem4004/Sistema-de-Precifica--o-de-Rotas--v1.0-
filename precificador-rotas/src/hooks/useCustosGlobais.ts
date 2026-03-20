import { useEffect, useState } from 'react';
import type { CustoGlobal } from '../types';
import { getCustosGlobais, updateCustosGlobais } from '../services/storageService';
import { mockCustosGlobais } from '../data/mockData';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro ao carregar custos globais';
}

export function useCustosGlobais() {
  const [custos, setCustos] = useState<CustoGlobal>(mockCustosGlobais);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setError(null);
        const loaded = await getCustosGlobais();
        setCustos(loaded);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const atualizarCustos = async (novosCustos: Partial<CustoGlobal>) => {
    const atualizados = await updateCustosGlobais(novosCustos);
    setCustos(atualizados);
    return atualizados;
  };

  return {
    custos,
    loading,
    error,
    atualizarCustos
  };
}
