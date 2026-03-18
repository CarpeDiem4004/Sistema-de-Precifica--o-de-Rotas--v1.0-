import React from 'react';
import type { Operacao } from '../../types';
import { validarMargem } from '../../services/calculosService';
import { MapPin, ArrowRight } from 'lucide-react';

interface RouteCardProps {
  operacao: Operacao;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const margemStyles = {
  success: 'bg-green-900/50 text-green-400',
  warning: 'bg-yellow-900/50 text-yellow-400',
  danger: 'bg-red-900/50 text-red-400',
};

export const RouteCard: React.FC<RouteCardProps> = ({ operacao, onEdit, onDelete }) => {
  const margemAtual = operacao.margemAtualPercent ?? operacao.margemOriginalPercent;
  const margemStatus = validarMargem(margemAtual);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 p-4 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-100">{operacao.nomeOperacao}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${margemStyles[margemStatus]}`}>
          Margem: {margemAtual.toFixed(1)}%
        </span>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <MapPin className="w-4 h-4" />
        <span>{operacao.codigoOrigem}</span>
        <ArrowRight className="w-4 h-4" />
        <span>{operacao.codigoDestino}</span>
        <span className="ml-auto font-medium">{operacao.distanciaKm} km</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Custo Total</p>
          <p className="font-semibold text-gray-200">R$ {operacao.custoTotalOriginal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500">Valor Venda</p>
          <p className="font-semibold text-gray-200">R$ {operacao.valorVenda.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500">Lucro</p>
          <p className="font-semibold text-green-400">
            R$ {(operacao.lucroAtual ?? operacao.lucroOriginal).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-700/50 text-xs text-gray-500">
        <span>Criado por: <span className="text-gray-400">{operacao.criadoPor || 'N/A'}</span></span>
        {operacao.editadoPor && (
          <span className="ml-3">| Editado por: <span className="text-gray-400">{operacao.editadoPor}</span></span>
        )}
      </div>
      
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700">
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
