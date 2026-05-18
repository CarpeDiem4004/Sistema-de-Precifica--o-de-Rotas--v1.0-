import { useCallback, useEffect, useState } from 'react';
import type { Base } from '../types';
import { getBases, createBase, deleteBase, importBasesFromCSV } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

type CsvRow = Record<string, string | number | undefined | null>;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro ao carregar bases';
}

export function useBases() {
  const { empresa, loading: authLoading, canEdit } = useAuth();
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadBases = useCallback(async () => {
    if (!empresa) {
      setBases([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedBases = await getBases(empresa.id);
      setBases(loadedBases);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [empresa]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!empresa) {
      setBases([]);
      setLoading(false);
      return;
    }

    void loadBases();
  }, [authLoading, empresa, loadBases]);

  const filteredBases = bases.filter(base =>
    base.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    base.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    base.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addBase = async (base: Base) => {
    if (!empresa) {
      throw new Error('Empresa não encontrada. Faça login novamente.');
    }

    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido criar ou editar bases.');
    }

    const created = await createBase(empresa.id, base);
    setBases((prev) => [...prev, created]);
  };

  const removeBase = async (id: string) => {
    if (!empresa) {
      throw new Error('Empresa não encontrada. Faça login novamente.');
    }

    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido excluir bases.');
    }

    await deleteBase(empresa.id, id);
    setBases((prev) => prev.filter((base) => base.id !== id));
  };

  const importBases = async (csvData: CsvRow[]) => {
    if (!empresa) {
      throw new Error('Empresa não encontrada. Faça login novamente.');
    }

    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido importar bases.');
    }

    const imported = await importBasesFromCSV(empresa.id, csvData);
    setBases(imported);
  };

  const getBaseByCodigo = (codigo: string): Base | undefined => {
    return bases.find(b => b.codigo === codigo);
  };

  return {
    bases: filteredBases,
    allBases: bases,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    addBase,
    removeBase,
    importBases,
    getBaseByCodigo,
    refresh: loadBases
  };
}
