import { useEffect, useState } from 'react';
import type { CustoGlobal } from '../types';
import { getCustosGlobais, updateCustosGlobais } from '../services/storageService';
import { mockCustosGlobais } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro ao carregar custos globais';
}

export function useCustosGlobais() {
  const { empresa, loading: authLoading, canEdit } = useAuth();
  const [custos, setCustos] = useState<CustoGlobal>(mockCustosGlobais);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!empresa) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        setError(null);
        const loaded = await getCustosGlobais(empresa.id);
        setCustos(loaded);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, empresa?.id]);

  const atualizarCustos = async (novosCustos: Partial<CustoGlobal>) => {
    if (!empresa) {
      throw new Error('Empresa não encontrada. Faça login novamente.');
    }

    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido alterar custos globais.');
    }

    const atualizados = await updateCustosGlobais(empresa.id, novosCustos);
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
