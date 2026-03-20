import { useState, useEffect } from 'react';
import type { Operacao } from '../types';
import { getOperacoes, saveOperacao, deleteOperacao } from '../services/storageService';
import { calcularCustoOperacional, calcularMargem } from '../services/calculosService';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro ao carregar operações';
}

export function useRotas() {
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadOperacoes();
  }, []);

  const loadOperacoes = async () => {
    setLoading(true);
    setError(null);

    try {
      const loaded = await getOperacoes();

      const comMargensAtuais = loaded.map(op => {
        if (op.status === 'aprovada') {
          const custoAtual = calcularCustoOperacional({
            distanciaKm: op.distanciaKm,
            custoCombustivel: op.custoCombustivelOriginal || 0,
            custoMotorista: typeof op.custoMotoristaOriginal === 'number' ? op.custoMotoristaOriginal : 0,
            pedagio: op.pedagio,
            tipoVeiculo: op.tipoVeiculo || 'proprio',
            valorAgregado: op.valorAgregado
          });

          const { lucro, margemPercent } = calcularMargem(custoAtual.custoTotal, op.valorVenda);

          return {
            ...op,
            lucroAtual: lucro,
            margemAtualPercent: margemPercent
          };
        }

        return op;
      });

      setOperacoes(comMargensAtuais);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const filteredOperacoes = operacoes.filter(op =>
    op.nomeOperacao.toLowerCase().includes(filtro.toLowerCase()) ||
    op.codigoOrigem.toLowerCase().includes(filtro.toLowerCase()) ||
    op.codigoDestino.toLowerCase().includes(filtro.toLowerCase())
  );

  const addOperacao = async (operacao: Operacao) => {
    const saved = await saveOperacao(operacao);
    setOperacoes((prev) => [...prev, saved]);
  };

  const updateOperacao = async (operacao: Operacao) => {
    const saved = await saveOperacao(operacao);
    setOperacoes((prev) => prev.map((op) => op.id === saved.id ? saved : op));
  };

  const removeOperacao = async (id: string) => {
    await deleteOperacao(id);
    setOperacoes((prev) => prev.filter((op) => op.id !== id));
  };

  const getOperacaoById = (id: string): Operacao | undefined => {
    return operacoes.find(op => op.id === id);
  };

  return {
    operacoes: filteredOperacoes,
    allOperacoes: operacoes,
    loading,
    error,
    filtro,
    setFiltro,
    addOperacao,
    updateOperacao,
    removeOperacao,
    getOperacaoById,
    refresh: loadOperacoes
  };
}
