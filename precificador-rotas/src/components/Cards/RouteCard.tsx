import React from 'react';
import type { Operacao } from '../../types';
import { validarMargem } from '../../services/calculosService';
import { MapPin, ArrowRight } from 'lucide-react';
import { formatarMoeda, formatarPercentual, formatarQuilometragem } from '../../utils/formatadores';

interface RouteCardProps {
  operacao: Operacao;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewHistory?: (operacao: Operacao) => void;
  showAlteracoes?: boolean;
  onToggleAtivo?: (id: string, ativo: boolean) => void;
}

const margemStyles = {
  success: 'bg-green-900/50 text-green-400',
  warning: 'bg-yellow-900/50 text-yellow-400',
  danger: 'bg-red-900/50 text-red-400',
};

function formatarDataHora(valor?: string) {
  if (!valor) {
    return 'Nao registrado';
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return 'Nao registrado';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(data);
}

export const RouteCard: React.FC<RouteCardProps> = ({ operacao, onEdit, onDelete, onViewHistory, showAlteracoes = true, onToggleAtivo }) => {
  const ativa = operacao.ativo !== false;
  const margemAtual = operacao.margemAtualPercent ?? operacao.margemOriginalPercent;
  const margemStatus = validarMargem(margemAtual);
  const custoCombustivel = operacao.custoCombustivelOriginal;
  const custoMotorista = operacao.custoMotoristaOriginal;
  const custoPedagio = operacao.pedagio;
  const custoOutros = operacao.outrosCustos;
  const repasseAgregado = operacao.valorAgregado ?? 0;

  const custoBaseProprio = custoCombustivel + custoMotorista + custoPedagio + custoOutros;
  const custoBaseAgregado = repasseAgregado + custoPedagio + custoOutros;

  const lucroProprio = operacao.valorVenda - custoBaseProprio;
  const lucroAgregado = operacao.valorVenda - custoBaseAgregado;
  const margemProprio = operacao.valorVenda > 0 ? (lucroProprio / operacao.valorVenda) * 100 : 0;
  const margemAgregado = operacao.valorVenda > 0 ? (lucroAgregado / operacao.valorVenda) * 100 : 0;
  const descricaoPedagioAgregado = custoPedagio > 0 ? 'Agregado com pedágio' : 'Agregado sem pedágio';

  return (
    <div className={`bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border p-4 hover:shadow-xl transition-shadow ${ativa ? 'border-slate-700' : 'border-red-800/70 opacity-90'}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-100">
          {operacao.nomeOperacao}
          {!ativa && <span className="ml-2 rounded-full bg-red-900/60 px-2 py-0.5 text-[11px] text-red-200">Desativada</span>}
        </h3>
        {ativa ? (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${margemStyles[margemStatus]}`}>
            Margem: {formatarPercentual(margemAtual)}
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-200">Fora do painel</span>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <MapPin className="w-4 h-4" />
        <span>{operacao.codigoOrigem}</span>
        <ArrowRight className="w-4 h-4" />
        <span>{operacao.codigoDestino}</span>
        <span className="ml-auto font-medium">{formatarQuilometragem(operacao.distanciaKm, 2)}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Custo Total</p>
          <p className="font-semibold text-gray-200">{formatarMoeda(operacao.custoTotalOriginal)}</p>
        </div>
        <div>
          <p className="text-gray-500">Valor Venda</p>
          <p className="font-semibold text-gray-200">{formatarMoeda(operacao.valorVenda)}</p>
        </div>
        <div>
          <p className="text-gray-500">Lucro</p>
          <p className="font-semibold text-green-400">
            {formatarMoeda(operacao.lucroAtual ?? operacao.lucroOriginal)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-800/70 bg-emerald-950/20 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-medium text-emerald-300">Custo frota própria</p>
            <span className={`rounded-full px-2 py-0.5 ${operacao.tipoVeiculo === 'proprio' ? 'bg-emerald-900/70 text-emerald-200' : 'bg-slate-800 text-slate-300'}`}>
              {operacao.tipoVeiculo === 'proprio' ? 'Ativo' : 'Referência'}
            </span>
          </div>
          <div className="space-y-1 text-gray-300">
            <p className="flex items-center justify-between"><span>Combustível</span><span>{formatarMoeda(custoCombustivel)}</span></p>
            <p className="flex items-center justify-between"><span>Motorista</span><span>{formatarMoeda(custoMotorista)}</span></p>
            <p className="flex items-center justify-between"><span>Pedágio</span><span>{formatarMoeda(custoPedagio)}</span></p>
            <p className="flex items-center justify-between"><span>Outros</span><span>{formatarMoeda(custoOutros)}</span></p>
            <p className="mt-1 border-t border-emerald-800/60 pt-1.5 flex items-center justify-between font-medium text-emerald-200">
              <span>Total</span><span>{formatarMoeda(custoBaseProprio)}</span>
            </p>
            <p className={`flex items-center justify-between font-medium ${lucroProprio >= 0 ? 'text-cyan-300' : 'text-red-300'}`}>
              <span>Lucro</span><span>{formatarMoeda(lucroProprio)}</span>
            </p>
            <p className={`flex items-center justify-between ${margemProprio >= 0 ? 'text-cyan-300/90' : 'text-red-300/90'}`}>
              <span>Margem</span><span>{formatarPercentual(margemProprio)}</span>
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-800/70 bg-amber-950/20 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-medium text-amber-300">Custo agregado</p>
            <span className={`rounded-full px-2 py-0.5 ${operacao.tipoVeiculo === 'agregado' ? 'bg-amber-900/70 text-amber-200' : 'bg-slate-800 text-slate-300'}`}>
              {operacao.tipoVeiculo === 'agregado' ? 'Ativo' : 'Referência'}
            </span>
          </div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-amber-300/80">{descricaoPedagioAgregado}</p>
          <div className="space-y-1 text-gray-300">
            <p className="flex items-center justify-between"><span>Repasse</span><span>{formatarMoeda(repasseAgregado)}</span></p>
            <p className="flex items-center justify-between"><span>Pedágio</span><span>{formatarMoeda(custoPedagio)}</span></p>
            <p className="flex items-center justify-between"><span>Outros</span><span>{formatarMoeda(custoOutros)}</span></p>
            <p className="mt-1 border-t border-amber-800/60 pt-1.5 flex items-center justify-between font-medium text-amber-200">
              <span>Total</span><span>{formatarMoeda(custoBaseAgregado)}</span>
            </p>
            <p className={`flex items-center justify-between font-medium ${lucroAgregado >= 0 ? 'text-cyan-300' : 'text-red-300'}`}>
              <span>Lucro</span><span>{formatarMoeda(lucroAgregado)}</span>
            </p>
            <p className={`flex items-center justify-between ${margemAgregado >= 0 ? 'text-cyan-300/90' : 'text-red-300/90'}`}>
              <span>Margem</span><span>{formatarPercentual(margemAgregado)}</span>
            </p>
          </div>
        </div>
      </div>

      {showAlteracoes && (
      <div className="mt-3 space-y-2 border-t border-slate-700/50 pt-3 text-xs text-gray-400">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-gray-500">Criado em</p>
            <p className="text-gray-300">{formatarDataHora(operacao.createdAt)}</p>
            <p className="text-gray-500">por {operacao.criadoPor || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Última alteração</p>
            <p className="text-gray-300">{formatarDataHora(operacao.dataEdicao ?? operacao.createdAt)}</p>
            <p className="text-gray-500">por {operacao.editadoPor || operacao.criadoPor || 'N/A'}</p>
          </div>
        </div>
      </div>
      )}
      
      {(onEdit || onDelete || onViewHistory || onToggleAtivo) && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700">
          {onToggleAtivo && (
            <button
              onClick={() => onToggleAtivo(operacao.id, !ativa)}
              className={`text-sm ${ativa ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
            >
              {ativa ? 'Desativar' : 'Reativar'}
            </button>
          )}
          {onViewHistory && (
            <button
              onClick={() => onViewHistory(operacao)}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              Ver histórico
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(operacao.id)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(operacao.id)}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Excluir
            </button>
          )}
        </div>
      )}
    </div>
  );
};
