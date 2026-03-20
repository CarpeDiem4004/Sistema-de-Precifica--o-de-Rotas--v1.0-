import { useState, useEffect } from 'react';
import type { Base } from '../types';
import { getBases, createBase, deleteBase, importBasesFromCSV } from '../services/storageService';

type CsvRow = Record<string, string | number | undefined | null>;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro ao carregar bases';
}

export function useBases() {
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadBases();
  }, []);

  const loadBases = async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedBases = await getBases();
      setBases(loadedBases);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const filteredBases = bases.filter(base =>
    base.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    base.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    base.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addBase = async (base: Base) => {
    const created = await createBase(base);
    setBases((prev) => [...prev, created]);
  };

  const removeBase = async (id: string) => {
    await deleteBase(id);
    setBases((prev) => prev.filter((base) => base.id !== id));
  };

  const importBases = async (csvData: CsvRow[]) => {
    const imported = await importBasesFromCSV(csvData);
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
