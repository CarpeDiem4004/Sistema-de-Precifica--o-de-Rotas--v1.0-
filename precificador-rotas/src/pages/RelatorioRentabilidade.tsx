import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Forms/Button';
import { Download } from 'lucide-react';

interface RotaRentavel {
  operacao_nome: string;
  motorista: string;
  placa: string;
  data_execucao: string;
  valor_faturado: number;
  custo_total: number;
  lucro: number;
  margem_percent: number;
  custo_por_km: number;
  rentabilidade: string;
}

export const RelatorioRentabilidade: React.FC = () => {
  const [data, setData] = useState<RotaRentavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtros] = useState({
    data_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    data_fim: new Date().toISOString().split('T')[0],
    veiculo_tipo: ''
  });

  const [topRotas, setTopRotas] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    if (!supabase) {
      setError('Supabase não configurado.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: relatorio, error: relatorioError } = await supabase
        .rpc('relatorio_rentabilidade', {
          p_data_inicio: filtros.data_inicio,
          p_data_fim: filtros.data_fim,
          p_veiculo_tipo: filtros.veiculo_tipo || null
        });

      if (relatorioError) throw relatorioError;

      const { data: top, error: topError } = await supabase
        .rpc('top_rotas_rentaveis', {
          p_limit: 10,
          p_data_inicio: filtros.data_inicio,
          p_data_fim: filtros.data_fim
        });

      if (topError) throw topError;

      setData(relatorio || []);
      setTopRotas(top || []);
    } catch (err: any) {
      console.error('Erro ao carregar relatório:', err);
      setError(err.message || 'Erro ao carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    // TODO: implementar exportação para CSV
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-950/50 border border-red-800 p-8 text-center">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={carregarDados}
          className="mt-4 px-6 py-2 bg-red-900 hover:bg-red-800 rounded-lg text-sm"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const totalReceita = data.reduce((sum, row) => sum + row.valor_faturado, 0);
  const totalCusto = data.reduce((sum, row) => sum + row.custo_total, 0);
  const totalLucro = totalReceita - totalCusto;
  const margemMedia = totalReceita > 0 ? (totalLucro / totalReceita * 100) : 0;

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Relatório de Rentabilidade</h1>
        <Button onClick={exportarCSV} variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Cards de Resumo - Dark */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <p className="text-sm text-slate-400">Total Faturamento</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">
            R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <p className="text-sm text-slate-400">Total Custos</p>
          <p className="text-3xl font-bold text-red-400 mt-2">
            R$ {totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <p className="text-sm text-slate-400">Lucro Total</p>
          <p className={`text-3xl font-bold mt-2 ${totalLucro >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            R$ {totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <p className="text-sm text-slate-400">Margem Média</p>
          <p className={`text-3xl font-bold mt-2 ${margemMedia >= 15 ? 'text-emerald-400' : margemMedia >= 8 ? 'text-amber-400' : 'text-red-400'}`}>
            {margemMedia.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Top Rotas */}
      {topRotas.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            🏆 Top 10 Rotas Mais Rentáveis
          </h2>
          {/* ... resto do topRotas adaptado para dark ... */}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Rota</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Motorista / Placa</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Data</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400">Faturamento</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400">Custo</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400">Lucro</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400">Margem</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                    Nenhum dado encontrado para o período selecionado.
                  </td>
                </tr>
              ) : (
                data.map((_row, index) => (
                  <tr key={index} className="hover:bg-slate-700/50">
                    {/* ... mesmas colunas, só troque as cores ... */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};