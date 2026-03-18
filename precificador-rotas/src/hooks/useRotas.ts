import { useState, useEffect } from 'react';
import type { Operacao } from '../types';
import { getOperacoes, saveOperacao, deleteOperacao } from '../services/storageService';
import { calcularCustoOperacional, calcularMargem } from '../services/calculosService';

export function useRotas() {
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    loadOperacoes();
  }, []);

  const loadOperacoes = () => {
    setLoading(true);
    const loaded = getOperacoes();
    
    // Recalcular margens atuais
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
    setLoading(false);
  };

  const filteredOperacoes = operacoes.filter(op =>
    op.nomeOperacao.toLowerCase().includes(filtro.toLowerCase()) ||
    op.codigoOrigem.toLowerCase().includes(filtro.toLowerCase()) ||
    op.codigoDestino.toLowerCase().includes(filtro.toLowerCase())
  );

  const addOperacao = (operacao: Operacao) => {
    const novas = [...operacoes, operacao];
    saveOperacao(operacao);
    setOperacoes(novas);
  };

  const updateOperacao = (operacao: Operacao) => {
    saveOperacao(operacao);
    setOperacoes(prev => prev.map(op => op.id === operacao.id ? operacao : op));
  };

  const removeOperacao = (id: string) => {
    deleteOperacao(id);
    setOperacoes(prev => prev.filter(op => op.id !== id));
  };

  const getOperacaoById = (id: string): Operacao | undefined => {
    return operacoes.find(op => op.id === id);
  };

  return {
    operacoes: filteredOperacoes,
    allOperacoes: operacoes,
    loading,
    filtro,
    setFiltro,
    addOperacao,
    updateOperacao,
    removeOperacao,
    getOperacaoById,
    refresh: loadOperacoes
  };
}
