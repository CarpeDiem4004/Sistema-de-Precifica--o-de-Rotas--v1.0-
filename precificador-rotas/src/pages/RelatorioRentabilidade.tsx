import React, { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Forms/Button';

interface Execucao {
  id: string;
  data_execucao: string;
  motorista_nome: string;
  veiculo_placa: string | null;
  veiculo_tipo: string;
  custo_total_real: number | null;
  valor_faturado: number | null;
  status: string;
  operacoes: { nome_operacao: string } | null;
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const badgeStatus: Record<string, string> = {
  concluida: 'bg-emerald-900/50 text-emerald-300',
  em_andamento: 'bg-blue-900/50 text-blue-300',
  agendada: 'bg-amber-900/50 text-amber-300',
  cancelada: 'bg-red-900/50 text-red-300',
};

const labelStatus: Record<string, string> = {
  concluida: 'Concluída',
  em_andamento: 'Em andamento',
  agendada: 'Agendada',
  cancelada: 'Cancelada',
};

function hoje() {
  return new Date().toISOString().split('T')[0];
}

function primeiroDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

export const RelatorioRentabilidade: React.FC = () => {
  const { empresa } = useAuth();
  const [data, setData] = useState<Execucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes());
  const [dataFim, setDataFim] = useState(hoje());

  const carregar = useCallback(async () => {
    if (!supabase || !empresa) {
      setError('Supabase não configurado.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('rotas_execucoes')
        .select('id, data_execucao, motorista_nome, veiculo_placa, veiculo_tipo, custo_total_real, valor_faturado, status, operacoes(nome_operacao)')
        .eq('empresa_id', empresa.id)
        .gte('data_execucao', dataInicio)
        .lte('data_execucao', dataFim)
        .order('data_execucao', { ascending: false });

      if (err) throw err;
      setData((rows as Execucao[]) ?? []);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message || 'Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [empresa, dataInicio, dataFim]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const concluidas = data.filter(r => r.status === 'concluida');
  const totalReceita = concluidas.reduce((s, r) => s + (r.valor_faturado ?? 0), 0);
  const totalCusto = concluidas.reduce((s, r) => s + (r.custo_total_real ?? 0), 0);
  const totalLucro = totalReceita - totalCusto;
  const margemMedia = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;

  const exportarCSV = () => {
    const header = 'Data,Rota,Motorista,Placa,Tipo,Receita,Custo,Lucro,Margem,Status';
    const linhas = data.map(r => {
      const receita = r.valor_faturado ?? 0;
      const custo = r.custo_total_real ?? 0;
      const lucro = receita - custo;
      const margem = receita > 0 ? ((lucro / receita) * 100).toFixed(1) : '0.0';
      return [
        r.data_execucao,
        r.operacoes?.nome_operacao ?? '',
        r.motorista_nome,
        r.veiculo_placa ?? '',
        r.veiculo_tipo,
        receita.toFixed(2),
        custo.toFixed(2),
        lucro.toFixed(2),
        margem + '%',
        labelStatus[r.status] ?? r.status,
      ].join(',');
    });
    const csv = [header, ...linhas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-rentabilidade-${dataInicio}-${dataFim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Relatório de Rentabilidade</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <span className="text-slate-500 text-sm">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <Button onClick={() => void carregar()} variant="secondary" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Filtrar
          </Button>
          <Button onClick={exportarCSV} variant="secondary" disabled={data.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-700 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-400">Faturamento</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">R$ {fmt(totalReceita)}</p>
          <p className="text-xs text-slate-500 mt-1">{concluidas.length} execuções concluídas</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-400">Custos</p>
          <p className="text-2xl font-bold text-red-400 mt-1">R$ {fmt(totalCusto)}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-400">Lucro</p>
          <p className={`text-2xl font-bold mt-1 ${totalLucro >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            R$ {fmt(totalLucro)}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-400">Margem média</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              margemMedia >= 15 ? 'text-emerald-400' : margemMedia >= 8 ? 'text-amber-400' : 'text-red-400'
            }`}
          >
            {margemMedia.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Rota</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Motorista / Placa</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">Receita</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">Custo</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">Lucro</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">Margem</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-slate-500 text-sm">
                    Nenhuma execução encontrada para o período selecionado.
                  </td>
                </tr>
              ) : (
                data.map(row => {
                  const receita = row.valor_faturado ?? 0;
                  const custo = row.custo_total_real ?? 0;
                  const lucro = receita - custo;
                  const margem = receita > 0 ? (lucro / receita) * 100 : 0;
                  return (
                    <tr key={row.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-slate-300 whitespace-nowrap">
                        {new Date(row.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-200 max-w-[180px] truncate">
                        {row.operacoes?.nome_operacao ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-300">
                        <div>{row.motorista_nome}</div>
                        {row.veiculo_placa && (
                          <div className="text-xs text-slate-500">{row.veiculo_placa}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right text-emerald-400 font-medium whitespace-nowrap">
                        R$ {fmt(receita)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right text-red-400 whitespace-nowrap">
                        R$ {fmt(custo)}
                      </td>
                      <td className={`px-5 py-3.5 text-sm text-right font-medium whitespace-nowrap ${lucro >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        R$ {fmt(lucro)}
                      </td>
                      <td
                        className={`px-5 py-3.5 text-sm text-right font-semibold whitespace-nowrap ${
                          margem >= 15 ? 'text-emerald-400' : margem >= 8 ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        {margem.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            badgeStatus[row.status] ?? 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {labelStatus[row.status] ?? row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
