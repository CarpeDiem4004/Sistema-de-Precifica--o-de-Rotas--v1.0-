import React, { useState } from 'react';
import { useRotas } from '../hooks/useRotas';
import { useCustosGlobais } from '../hooks/useCustosGlobais';
import { StatCard } from '../components/Cards/StatCard';
import { formatarMoeda, formatarPercentual } from '../utils/formatadores';
import { Truck, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const [limiteRiscoPercent, setLimiteRiscoPercent] = useState(8);
  const { allOperacoes, error: operacoesError } = useRotas();
  const { custos, error: custosError } = useCustosGlobais();
  const { isSuspended } = useAuth();

  const aprovadas = allOperacoes.filter(op => op.status === 'aprovada' && op.ativo !== false);
  const rotasPropriasReais = aprovadas.filter((op) => op.tipoVeiculo === 'proprio');
  const rotasTerceirasReais = aprovadas.filter((op) => op.tipoVeiculo === 'agregado');

  const totalRotas = aprovadas.length;
  const receitaTotal = aprovadas.reduce((sum, op) => sum + op.valorVenda, 0);
  const margemMedia = totalRotas > 0
    ? aprovadas.reduce((sum, op) => sum + (op.margemAtualPercent ?? op.margemOriginalPercent), 0) / totalRotas
    : 0;
  const rotasEmRiscoDetalhes = aprovadas.filter(op => (op.margemAtualPercent ?? op.margemOriginalPercent) < limiteRiscoPercent);
  const rotasEmRisco = rotasEmRiscoDetalhes.length;

  const handleEditarLimiteRisco = () => {
    if (rotasEmRiscoDetalhes.length > 0) {
      const resumoRotas = rotasEmRiscoDetalhes
        .slice(0, 8)
        .map((op, index) => `${index + 1}. ${op.nomeOperacao} (${op.codigoOrigem} -> ${op.codigoDestino}) - margem ${formatarPercentual(op.margemAtualPercent ?? op.margemOriginalPercent)}`)
        .join('\n');

      const restante = rotasEmRiscoDetalhes.length - 8;
      const complemento = restante > 0 ? `\n... e mais ${restante} rota(s).` : '';

      window.alert(
        `Rotas em risco (limite ${formatarPercentual(limiteRiscoPercent)}):\n\n${resumoRotas}${complemento}`
      );
    } else {
      window.alert(`Nenhuma rota em risco para o limite atual de ${formatarPercentual(limiteRiscoPercent)}.`);
    }

    const resposta = window.prompt('Defina o limite de risco em % (ex.: 8 ou 8,5):', limiteRiscoPercent.toString().replace('.', ','));

    if (resposta === null) {
      return;
    }

    const valorNormalizado = resposta.trim().replace(',', '.');
    const novoLimite = Number(valorNormalizado);

    if (!Number.isFinite(novoLimite) || novoLimite < 0 || novoLimite > 100) {
      window.alert('Informe um valor válido entre 0 e 100.');
      return;
    }

    setLimiteRiscoPercent(novoLimite);
  };

  const calcularResumoPorTipo = (tipo: 'proprio' | 'agregado') => {
    // Visao comparativa: aplica cada modelo de custo sobre todas as rotas aprovadas.
    const rotas = aprovadas;
    const quantidade = rotas.length;
    const receita = rotas.reduce((sum, op) => sum + op.valorVenda, 0);

    const lucroBruto = rotas.reduce((sum, op) => {
      const custoBase = tipo === 'proprio'
        ? (op.custoCombustivelOriginal + op.custoMotoristaOriginal + op.pedagio)
        : ((op.valorAgregado ?? 0) + op.pedagio);
      return sum + (op.valorVenda - custoBase);
    }, 0);

    const lucroLiquido = rotas.reduce((sum, op) => {
      const custoTotal = tipo === 'proprio'
        ? (op.custoCombustivelOriginal + op.custoMotoristaOriginal + op.pedagio + op.outrosCustos)
        : ((op.valorAgregado ?? 0) + op.pedagio + op.outrosCustos);
      return sum + (op.valorVenda - custoTotal);
    }, 0);

    const margemLiquida = receita > 0 ? (lucroLiquido / receita) * 100 : 0;

    return {
      quantidade,
      receita,
      lucroBruto,
      lucroLiquido,
      margemLiquida
    };
  };

  const resumoProprio = calcularResumoPorTipo('proprio');
  const resumoTerceiro = calcularResumoPorTipo('agregado');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <div className="text-sm text-gray-400">
          Diesel atual: <span className="font-semibold text-gray-200">R$ {custos.precoDieselLitro.toFixed(2)}/L</span>
        </div>
      </div>

      {isSuspended && (
        <div className="mb-6 rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          Empresa suspensa: os indicadores continuam visíveis, mas não é possível alterar dados operacionais.
        </div>
      )}

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
          value={formatarPercentual(margemMedia)}
          icon={<TrendingUp className="w-6 h-6" />}
          color={margemMedia >= 15 ? 'green' : margemMedia >= 8 ? 'yellow' : 'red'}
        />
        <StatCard
          title="Rotas em Risco"
          value={rotasEmRisco}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={rotasEmRisco > 0 ? 'red' : 'green'}
          subtitle={`Margem < ${formatarPercentual(limiteRiscoPercent)} • clique para alterar`}
          onClick={handleEditarLimiteRisco}
        />
      </div>

      <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Visão por Tipo de Frota</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-emerald-800/70 bg-emerald-950/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-emerald-300">Frota Própria</h3>
              <span className="rounded-full bg-emerald-900/60 px-2 py-1 text-xs text-emerald-200">
                {rotasPropriasReais.length} real | {resumoProprio.quantidade} avaliada(s)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Receita</p>
                <p className="font-semibold text-gray-100">{formatarMoeda(resumoProprio.receita)}</p>
              </div>
              <div>
                <p className="text-gray-400">Lucro Bruto</p>
                <p className={`font-semibold ${resumoProprio.lucroBruto >= 0 ? 'text-cyan-300' : 'text-red-300'}`}>
                  {formatarMoeda(resumoProprio.lucroBruto)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Lucro Líquido</p>
                <p className={`font-semibold ${resumoProprio.lucroLiquido >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {formatarMoeda(resumoProprio.lucroLiquido)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Margem Líquida</p>
                <p className={`font-semibold ${resumoProprio.margemLiquida >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {formatarPercentual(resumoProprio.margemLiquida)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-800/70 bg-amber-950/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-amber-300">Frota Terceira</h3>
              <span className="rounded-full bg-amber-900/60 px-2 py-1 text-xs text-amber-200">
                {rotasTerceirasReais.length} real | {resumoTerceiro.quantidade} avaliada(s)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Receita</p>
                <p className="font-semibold text-gray-100">{formatarMoeda(resumoTerceiro.receita)}</p>
              </div>
              <div>
                <p className="text-gray-400">Lucro Bruto</p>
                <p className={`font-semibold ${resumoTerceiro.lucroBruto >= 0 ? 'text-cyan-300' : 'text-red-300'}`}>
                  {formatarMoeda(resumoTerceiro.lucroBruto)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Lucro Líquido</p>
                <p className={`font-semibold ${resumoTerceiro.lucroLiquido >= 0 ? 'text-amber-300' : 'text-red-300'}`}>
                  {formatarMoeda(resumoTerceiro.lucroLiquido)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Margem Líquida</p>
                <p className={`font-semibold ${resumoTerceiro.margemLiquida >= 0 ? 'text-amber-300' : 'text-red-300'}`}>
                  {formatarPercentual(resumoTerceiro.margemLiquida)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
