import React from 'react';
import type { HistoricoAlteracaoCampo, Operacao } from '../types';
import { Button } from './Forms/Button';
import { formatarDataHora, formatarMoeda, formatarPercentual, formatarQuilometragem } from '../utils/formatadores';

interface OperationHistoryModalProps {
  operacao: Operacao;
  onClose: () => void;
}

function formatarLinhaHistorico(item: HistoricoAlteracaoCampo) {
  if (item.direcao === 'aumentou') {
    return `${item.campo} aumentou de ${item.antes} para ${item.depois}`;
  }

  if (item.direcao === 'diminuiu') {
    return `${item.campo} diminuiu de ${item.antes} para ${item.depois}`;
  }

  return `${item.campo} mudou de ${item.antes} para ${item.depois}`;
}

export const OperationHistoryModal: React.FC<OperationHistoryModalProps> = ({ operacao, onClose }) => {
  const historico = operacao.historicoAlteracoes ?? [];
  const margemAtual = operacao.margemAtualPercent ?? operacao.margemOriginalPercent;
  const lucroAtual = operacao.lucroAtual ?? operacao.lucroOriginal;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/75 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4 pt-[64px]">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-700 px-6 py-5 flex-shrink-0">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Detalhes da operação</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-100">{operacao.nomeOperacao}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {operacao.codigoOrigem} → {operacao.codigoDestino} • {formatarQuilometragem(operacao.distanciaKm, 2)}
            </p>
          </div>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </div>

        <div className="grid gap-6 overflow-y-auto p-6 grid-cols-1 lg:grid-cols-2 flex-1">
          <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4 h-fit">
            <h3 className="text-lg font-medium text-slate-100">Resumo atual</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400">Criado em</p>
                <p className="text-slate-200">{formatarDataHora(operacao.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Última alteração</p>
                <p className="text-slate-200">{formatarDataHora(operacao.dataEdicao ?? operacao.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Criado por</p>
                <p className="text-slate-200">{operacao.criadoPor}</p>
              </div>
              <div>
                <p className="text-slate-400">Editado por</p>
                <p className="text-slate-200">{operacao.editadoPor ?? operacao.criadoPor}</p>
              </div>
              <div>
                <p className="text-slate-400">Tipo ativo</p>
                <p className="text-slate-200">{operacao.tipoVeiculo === 'proprio' ? 'Frota própria' : 'Terceiro / agregado'}</p>
              </div>
              <div>
                <p className="text-slate-400">Status</p>
                <p className="text-slate-200">{operacao.status === 'aprovada' ? 'Aprovada' : 'Rascunho'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-950/40 p-3">
                <p className="text-slate-400">Custo total</p>
                <p className="text-lg font-semibold text-slate-100">{formatarMoeda(operacao.custoTotalOriginal)}</p>
              </div>
              <div className="rounded-lg bg-slate-950/40 p-3">
                <p className="text-slate-400">Valor de venda</p>
                <p className="text-lg font-semibold text-slate-100">{formatarMoeda(operacao.valorVenda)}</p>
              </div>
              <div className="rounded-lg bg-slate-950/40 p-3">
                <p className="text-slate-400">Lucro atual</p>
                <p className="text-lg font-semibold text-emerald-400">{formatarMoeda(lucroAtual)}</p>
              </div>
              <div className="rounded-lg bg-slate-950/40 p-3">
                <p className="text-slate-400">Margem atual</p>
                <p className="text-lg font-semibold text-cyan-300">{formatarPercentual(margemAtual)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-800/70 bg-emerald-950/20 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium text-emerald-300">Frota própria</p>
                  <span className={`rounded-full px-2 py-1 text-xs ${operacao.tipoVeiculo === 'proprio' ? 'bg-emerald-900/70 text-emerald-200' : 'bg-slate-800 text-slate-300'}`}>
                    {operacao.tipoVeiculo === 'proprio' ? 'Ativo' : 'Referência'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-200">
                  <p>Diesel: {formatarMoeda(operacao.custoDieselLitroOriginal)}</p>
                  <p>Consumo: {operacao.consumoKmL.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/l</p>
                  <p>Combustível: {formatarMoeda(operacao.custoCombustivelOriginal)}</p>
                  <p>Motorista: {formatarMoeda(operacao.custoMotoristaOriginal)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-amber-800/70 bg-amber-950/20 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium text-amber-300">Terceiro / agregado</p>
                  <span className={`rounded-full px-2 py-1 text-xs ${operacao.tipoVeiculo === 'agregado' ? 'bg-amber-900/70 text-amber-200' : 'bg-slate-800 text-slate-300'}`}>
                    {operacao.tipoVeiculo === 'agregado' ? 'Ativo' : 'Referência'}
                  </span>
                </div>
                <p className="text-slate-200">Repasse: {formatarMoeda(operacao.valorAgregado ?? 0)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-medium text-slate-100">Histórico completo</h3>
              <span className="rounded-full bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                {historico.length} registro(s)
              </span>
            </div>

            {historico.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/30 p-6 text-center text-sm text-slate-400">
                Nenhuma alteração registrada ainda para esta operação.
              </div>
            ) : (
              <div className="space-y-4">
                {historico.map((registro, index) => (
                  <div key={`${registro.data}-${registro.usuario}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/30 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{formatarDataHora(registro.data)}</p>
                        <p className="text-xs text-slate-400">Alterado por {registro.usuario}</p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                        {registro.alteracoes.length} mudança(s)
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-200">
                      {registro.alteracoes.map((item, itemIndex) => (
                        <div key={`${item.campo}-${itemIndex}`} className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                          {formatarLinhaHistorico(item)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      </div>
    </div>
  );
};