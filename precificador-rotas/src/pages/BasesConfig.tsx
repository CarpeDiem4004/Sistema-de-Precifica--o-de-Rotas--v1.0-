import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useBases } from '../hooks/useBases';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { Search, Upload, Plus, Trash2, MapPin } from 'lucide-react';

const BasesConfig: React.FC = () => {
  const { bases, allBases, searchTerm, setSearchTerm, addBase, removeBase, importBases } = useBases();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form para nova base
  const [showForm, setShowForm] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');

  const handleAddBase = () => {
    if (!codigo || !endereco) return;
    
    addBase({
      id: `base_${Date.now()}`,
      codigo: codigo.toUpperCase(),
      nome,
      endereco
    });
    
    setCodigo('');
    setNome('');
    setEndereco('');
    setShowForm(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        importBases(results.data);
      },
      error: (error) => {
        console.error('Erro ao importar CSV:', error);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta base?')) {
      removeBase(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Bases</h1>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Importar CSV
            </div>
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Base
            </div>
          </Button>
        </div>
      </div>

      {/* Formulário de nova base */}
      {showForm && (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Adicionar Base</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Input
              label="Código"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: SP003"
            />
            <Input
              label="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Base São Paulo - Leste"
            />
            <Input
              label="Endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddBase} disabled={!codigo || !endereco}>
              Adicionar
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="mb-4">
        <Input
          placeholder="Buscar por código, nome ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-4 h-4 text-gray-400" />}
        />
      </div>

      {/* Contador */}
      <p className="text-sm text-gray-400 mb-4">
        {bases.length} de {allBases.length} bases
      </p>

      {/* Tabela de bases */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700/50 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Código</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Nome</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Endereço</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Coordenadas</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {bases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma base encontrada.
                </td>
              </tr>
            ) : (
              bases.map(base => (
                <tr key={base.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-gray-200">{base.codigo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{base.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{base.endereco}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {base.lat && base.lng
                      ? `${base.lat.toFixed(4)}, ${base.lng.toFixed(4)}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(base.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BasesConfig;
