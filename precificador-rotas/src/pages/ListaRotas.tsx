import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRotas } from '../hooks/useRotas';
import { RouteCard } from '../components/Cards/RouteCard';
import { OperationHistoryModal } from '../components/OperationHistoryModal';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { PlusCircle, Search } from 'lucide-react';
import { useTenantPath } from '../hooks/useTenantPath';
import { useAuth } from '../contexts/AuthContext';
import type { Operacao } from '../types';

const ListaRotas: React.FC = () => {
  const navigate = useNavigate();
  const tenantPath = useTenantPath();
  const { canEdit, isSuspended } = useAuth();
  const { operacoes, loading, error, filtro, setFiltro, removeOperacao, setOperacaoAtiva } = useRotas();
  const [statusFilter, setStatusFilter] = useState<'todas' | 'aprovada' | 'rascunho'>('todas');
  const [operacaoSelecionada, setOperacaoSelecionada] = useState<Operacao | null>(null);

  const filteredByStatus = statusFilter === 'todas'
    ? operacoes
    : operacoes.filter(op => op.status === statusFilter);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta operação?')) {
      await removeOperacao(id);
    }
  };

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    const mensagem = ativo
      ? 'Deseja reativar esta operação?'
      : 'Deseja desativar esta operação? Ela ficará fora dos indicadores até reativação.';

    if (window.confirm(mensagem)) {
      await setOperacaoAtiva(id, ativo);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Lista de Rotas</h1>
        <Button onClick={() => navigate(tenantPath('/nova-operacao'))} disabled={!canEdit}>
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Nova Operação
          </div>
        </Button>
      </div>

      {isSuspended && (
        <div className="mb-6 rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          Empresa suspensa: é possível consultar as rotas, mas criar, editar e excluir está desativado.
        </div>
      )}

      {/* Filtros */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Input
              label="Buscar"
              placeholder="Buscar por nome, origem ou destino..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              icon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>
          <div className="flex gap-2">
            {(['todas', 'aprovada', 'rascunho'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {status === 'todas' ? 'Todas' : status === 'aprovada' ? 'Aprovadas' : 'Rascunhos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {filteredByStatus.length === 0 ? (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 p-8 text-center text-gray-400">
          <p>{loading ? 'Carregando operações...' : 'Nenhuma operação encontrada.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredByStatus.map(op => (
            <RouteCard
              key={op.id}
              operacao={op}
              onToggleAtivo={canEdit ? handleToggleAtivo : undefined}
              onViewHistory={setOperacaoSelecionada}
              onEdit={canEdit ? (id) => navigate(tenantPath(`/editar-operacao/${id}`)) : undefined}
              onDelete={canEdit ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

      {operacaoSelecionada && (
        <OperationHistoryModal
          operacao={operacaoSelecionada}
          onClose={() => setOperacaoSelecionada(null)}
        />
      )}
    </div>
  );
};

export default ListaRotas;
