import { useState, useEffect } from 'react';
import type { Base } from '../types';
import { getBases, saveBases, importBasesFromCSV } from '../services/storageService';

export function useBases() {
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBases();
  }, []);

  const loadBases = () => {
    setLoading(true);
    const loadedBases = getBases();
    setBases(loadedBases);
    setLoading(false);
  };

  const filteredBases = bases.filter(base =>
    base.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    base.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    base.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addBase = (base: Base) => {
    const newBases = [...bases, base];
    saveBases(newBases);
    setBases(newBases);
  };

  const removeBase = (id: string) => {
    const newBases = bases.filter(b => b.id !== id);
    saveBases(newBases);
    setBases(newBases);
  };

  const importBases = (csvData: any[]) => {
    const imported = importBasesFromCSV(csvData);
    setBases(imported);
  };

  const getBaseByCodigo = (codigo: string): Base | undefined => {
    return bases.find(b => b.codigo === codigo);
  };

  return {
    bases: filteredBases,
    allBases: bases,
    loading,
    searchTerm,
    setSearchTerm,
    addBase,
    removeBase,
    importBases,
    getBaseByCodigo,
    refresh: loadBases
  };
}
