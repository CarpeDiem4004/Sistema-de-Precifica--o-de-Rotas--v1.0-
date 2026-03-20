import React from 'react';
import { useRotas } from '../hooks/useRotas';
import { useCustosGlobais } from '../hooks/useCustosGlobais';
import { StatCard } from '../components/Cards/StatCard';
import { RouteCard } from '../components/Cards/RouteCard';
import { formatarMoeda } from '../utils/formatadores';
import { Truck, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { allOperacoes, loading: operacoesLoading, error: operacoesError } = useRotas();
  const { custos, loading: custosLoading, error: custosError } = useCustosGlobais();
  const navigate = useNavigate();

  const aprovadas = allOperacoes.filter(op => op.status === 'aprovada');
  const totalRotas = aprovadas.length;
  const receitaTotal = aprovadas.reduce((sum, op) => sum + op.valorVenda, 0);
  const lucroTotal = aprovadas.reduce((sum, op) => sum + (op.lucroAtual ?? op.lucroOriginal), 0);
  const margemMedia = totalRotas > 0
    ? aprovadas.reduce((sum, op) => sum + (op.margemAtualPercent ?? op.margemOriginalPercent), 0) / totalRotas
    : 0;
  const rotasEmRisco = aprovadas.filter(op => (op.margemAtualPercent ?? op.margemOriginalPercent) < 8).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <div className="text-sm text-gray-400">
          Diesel atual: <span className="font-semibold text-gray-200">R$ {custos.precoDieselLitro.toFixed(2)}/L</span>
        </div>
      </div>

      {/* KPI Cards */}
      {(operacoesError || custosError) && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {operacoesError || custosError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Rotas Ativas"
          value={totalRotas}
          icon={<Truck className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Receita Total"
          value={formatarMoeda(receitaTotal)}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Margem Média"
          value={`${margemMedia.toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color={margemMedia >= 15 ? 'green' : margemMedia >= 8 ? 'yellow' : 'red'}
        />
        <StatCard
          title="Rotas em Risco"
          value={rotasEmRisco}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={rotasEmRisco > 0 ? 'red' : 'green'}
          subtitle="Margem < 8%"
        />
      </div>

      {/* Lucro total */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">Resumo Financeiro</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-400">Receita Total</p>
            <p className="text-2xl font-bold text-blue-400">{formatarMoeda(receitaTotal)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Lucro Total</p>
            <p className="text-2xl font-bold text-green-400">{formatarMoeda(lucroTotal)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Custo Total</p>
            <p className="text-2xl font-bold text-gray-200">{formatarMoeda(receitaTotal - lucroTotal)}</p>
          </div>
        </div>
      </div>

      {/* Últimas Operações */}
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Últimas Operações</h2>
      {aprovadas.length === 0 ? (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 p-8 text-center text-gray-400">
          <p>{operacoesLoading || custosLoading ? 'Carregando dashboard...' : 'Nenhuma operação aprovada ainda.'}</p>
          <button
            onClick={() => navigate('/nova-operacao')}
            className="mt-3 text-blue-400 hover:text-blue-300 font-medium"
          >
            Criar primeira operação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aprovadas.slice(-4).reverse().map(op => (
            <RouteCard
              key={op.id}
              operacao={op}
              onEdit={(id) => navigate(`/editar-operacao/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
