import { useCallback, useEffect, useState } from 'react';
import type { Operacao } from '../types';
import { getOperacoes, saveOperacao, deleteOperacao } from '../services/storageService';
import { calcularCustoOperacional, calcularMargem } from '../services/calculosService';
import { useAuth } from '../contexts/AuthContext';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro ao carregar operações';
}

export function useRotas() {
  const { empresa, perfil, loading: authLoading, canEdit } = useAuth();
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadOperacoes = useCallback(async () => {
    if (!empresa) {
      setOperacoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loaded = await getOperacoes(empresa.id);

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
  }, [empresa]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!empresa) {
      setOperacoes([]);
      setLoading(false);
      return;
    }

    void loadOperacoes();
  }, [authLoading, empresa, loadOperacoes]);

  const filteredOperacoes = operacoes.filter(op =>
    op.nomeOperacao.toLowerCase().includes(filtro.toLowerCase()) ||
    op.codigoOrigem.toLowerCase().includes(filtro.toLowerCase()) ||
    op.codigoDestino.toLowerCase().includes(filtro.toLowerCase())
  );

  const addOperacao = async (operacao: Operacao) => {
    if (!empresa || !perfil) {
      throw new Error('Usuário não autenticado para salvar operação.');
    }

    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido criar ou editar operações.');
    }

    const saved = await saveOperacao({
      empresaId: empresa.id,
      usuarioId: perfil.id,
      usuarioNome: perfil.nome
    }, operacao);
    setOperacoes((prev) => [...prev, saved]);
  };

  const updateOperacao = async (operacao: Operacao) => {
    if (!empresa || !perfil) {
      throw new Error('Usuário não autenticado para atualizar operação.');
    }

    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido criar ou editar operações.');
    }

    const saved = await saveOperacao({
      empresaId: empresa.id,
      usuarioId: perfil.id,
      usuarioNome: perfil.nome
    }, operacao);
    setOperacoes((prev) => prev.map((op) => op.id === saved.id ? saved : op));
  };

  const removeOperacao = async (id: string) => {
    if (!empresa) {
      throw new Error('Empresa não encontrada. Faça login novamente.');
    }

    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido excluir operações.');
    }

    await deleteOperacao(empresa.id, id);
    setOperacoes((prev) => prev.filter((op) => op.id !== id));
  };

  const setOperacaoAtiva = async (id: string, ativo: boolean) => {
    if (!empresa || !perfil) {
      throw new Error('Usuário não autenticado para alterar status da rota.');
    }

    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido alterar status de rotas.');
    }

    const operacaoAtual = operacoes.find((op) => op.id === id);

    if (!operacaoAtual) {
      throw new Error('Operação não encontrada.');
    }

    const operacaoAtualizada: Operacao = {
      ...operacaoAtual,
      ativo,
      editadoPor: perfil.nome,
      dataEdicao: new Date().toISOString()
    };

    const saved = await saveOperacao({
      empresaId: empresa.id,
      usuarioId: perfil.id,
      usuarioNome: perfil.nome
    }, operacaoAtualizada);

    setOperacoes((prev) => prev.map((op) => op.id === saved.id ? saved : op));
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
    setOperacaoAtiva,
    getOperacaoById,
    refresh: loadOperacoes
  };
}
