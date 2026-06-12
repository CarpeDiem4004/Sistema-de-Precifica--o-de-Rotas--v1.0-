import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Plus, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Forms/Button';

interface Operacao {
  id: string;
  nome_operacao: string;
  endereco_origem: string;
  endereco_destino: string;
  valor_venda: number;
}

const defaultForm = {
  operacao_id: '',
  data_execucao: new Date().toISOString().split('T')[0],
  motorista_nome: '',
  veiculo_placa: '',
  veiculo_tipo: 'proprio' as 'proprio' | 'terceiro' | 'agregado',
  combustivel_litros: '',
  combustivel_valor: '',
  pedagio_real: '',
  manutencao: '',
  outros_custos: '',
  valor_faturado: '',
  status: 'concluida' as 'concluida' | 'em_andamento' | 'agendada' | 'cancelada',
  observacoes: '',
};

type FormData = typeof defaultForm;

const inputCls =
  'w-full rounded-xl bg-slate-700 border border-slate-600 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1';

export default function RegistroExecucao() {
  const { empresa, perfil } = useAuth();
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loadingOps, setLoadingOps] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>(defaultForm);

  useEffect(() => {
    if (!supabase || !empresa) {
      setLoadingOps(false);
      return;
    }
    supabase
      .from('operacoes')
      .select('id, nome_operacao, endereco_origem, endereco_destino, valor_venda')
      .eq('empresa_id', empresa.id)
      .eq('ativo', true)
      .order('nome_operacao')
      .then(({ data }) => {
        setOperacoes(data ?? []);
        setLoadingOps(false);
      });
  }, [empresa]);

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const custoTotal =
    (parseFloat(form.combustivel_valor) || 0) +
    (parseFloat(form.pedagio_real) || 0) +
    (parseFloat(form.manutencao) || 0) +
    (parseFloat(form.outros_custos) || 0);

  const valorFaturado = parseFloat(form.valor_faturado) || 0;
  const lucro = valorFaturado - custoTotal;
  const margem = valorFaturado > 0 ? (lucro / valorFaturado) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !empresa || !perfil) return;
    setError('');
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from('rotas_execucoes').insert({
        operacao_id: form.operacao_id,
        empresa_id: empresa.id,
        usuario_id: perfil.id,
        data_execucao: form.data_execucao,
        motorista_nome: form.motorista_nome,
        veiculo_placa: form.veiculo_placa || null,
        veiculo_tipo: form.veiculo_tipo,
        combustivel_litros: parseFloat(form.combustivel_litros) || null,
        combustivel_valor: parseFloat(form.combustivel_valor) || null,
        pedagio_real: parseFloat(form.pedagio_real) || null,
        manutencao: parseFloat(form.manutencao) || null,
        outros_custos: parseFloat(form.outros_custos) || null,
        custo_total_real: custoTotal || null,
        valor_faturado: valorFaturado || null,
        status: form.status,
        observacoes: form.observacoes || null,
      });
      if (err) throw err;
      setSuccess(true);
      setForm(defaultForm);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      setError(
        e.code === '23505'
          ? 'Já existe uma execução registrada para esta rota nesta data.'
          : e.message || 'Erro ao registrar execução.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Registrar Execução</h1>
        <div className="rounded-2xl bg-emerald-900/30 border border-emerald-700 p-10 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">Execução registrada com sucesso!</h2>
          <p className="mt-2 text-sm text-slate-400">
            Os dados foram salvos e aparecerão no relatório de rentabilidade.
          </p>
          <Button onClick={() => setSuccess(false)} className="mt-6">
            <Plus className="w-4 h-4 mr-2" />
            Registrar outra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Registrar Execução</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-700 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rota</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Operação *</label>
              <select
                required
                value={form.operacao_id}
                onChange={e => set('operacao_id', e.target.value)}
                className={inputCls}
                disabled={loadingOps}
              >
                <option value="">
                  {loadingOps ? 'Carregando rotas...' : 'Selecione uma rota'}
                </option>
                {operacoes.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.nome_operacao}
                  </option>
                ))}
              </select>
              {!loadingOps && operacoes.length === 0 && (
                <p className="mt-1 text-xs text-amber-400">
                  Nenhuma rota ativa encontrada. Crie uma operação primeiro.
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>Data de execução *</label>
              <input
                type="date"
                required
                value={form.data_execucao}
                onChange={e => set('data_execucao', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as FormData['status'])}
                className={inputCls}
              >
                <option value="concluida">Concluída</option>
                <option value="em_andamento">Em andamento</option>
                <option value="agendada">Agendada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Veículo e Motorista</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Motorista *</label>
              <input
                type="text"
                required
                placeholder="Nome do motorista"
                value={form.motorista_nome}
                onChange={e => set('motorista_nome', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Placa</label>
              <input
                type="text"
                placeholder="AAA-0000"
                value={form.veiculo_placa}
                onChange={e => set('veiculo_placa', e.target.value.toUpperCase())}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tipo de frota</label>
              <select
                value={form.veiculo_tipo}
                onChange={e => set('veiculo_tipo', e.target.value as FormData['veiculo_tipo'])}
                className={inputCls}
              >
                <option value="proprio">Frota própria</option>
                <option value="terceiro">Terceiro</option>
                <option value="agregado">Agregado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custos Reais</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Combustível R$</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.combustivel_valor}
                onChange={e => set('combustivel_valor', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Combustível litros</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.combustivel_litros}
                onChange={e => set('combustivel_litros', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Pedágio R$</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.pedagio_real}
                onChange={e => set('pedagio_real', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Manutenção R$</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.manutencao}
                onChange={e => set('manutencao', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Outros R$</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.outros_custos}
                onChange={e => set('outros_custos', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Valor faturado R$ *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                value={form.valor_faturado}
                onChange={e => set('valor_faturado', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {(custoTotal > 0 || valorFaturado > 0) && (
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700">
              <div className="text-center">
                <p className="text-xs text-slate-500">Custo total</p>
                <p className="text-lg font-bold text-red-400">
                  R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Lucro</p>
                <p className={`text-lg font-bold ${lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  R$ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Margem</p>
                <p
                  className={`text-lg font-bold ${
                    margem >= 15 ? 'text-emerald-400' : margem >= 8 ? 'text-amber-400' : 'text-red-400'
                  }`}
                >
                  {margem.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6">
          <label className={labelCls}>Observações</label>
          <textarea
            rows={3}
            placeholder="Ocorrências, anotações..."
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            className={inputCls + ' resize-none'}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={submitting} size="lg">
            <Truck className="w-4 h-4 mr-2" />
            Registrar execução
          </Button>
        </div>
      </form>
    </div>
  );
}
