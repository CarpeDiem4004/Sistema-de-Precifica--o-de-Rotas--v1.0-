import { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, PauseCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../../components/Forms/Button';
import { Input } from '../../components/Forms/Input';
import {
  alterarPlano,
  alterarModoAcessoEmpresa,
  aprovarEmpresa,
  listEmpresas,
  type EmpresaAdmin
} from '../../services/adminService';
import { getTenantAccessLabel, getTenantAccessMode } from '../../lib/tenantAccess';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return (error as { message?: string })?.message ?? fallback;
}

function formatDateTimeSafe(value: string | null | undefined) {
  if (!value) {
    return 'Data indisponível';
  }

  if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value;
  }

  // Normaliza timestamps comuns do Postgres (ex.: "2026-03-20 20:06:05.318322+00").
  const normalized = value
    .replace(' ', 'T')
    .replace(/([+-]\d{2})$/, '$1:00')
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

const planos: Array<EmpresaAdmin['plano']> = ['trial', 'basico', 'profissional', 'enterprise'];

const planoLabel: Record<EmpresaAdmin['plano'], string> = {
  trial: 'Trial',
  basico: 'Básico',
  profissional: 'Profissional',
  enterprise: 'Enterprise'
};

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregar = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await listEmpresas(search, status);
      setEmpresas(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Erro ao carregar empresas.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  const totalAtivas = useMemo(() => empresas.filter((item) => item.status === 'ativo').length, [empresas]);

  const getEmpresaAccessMode = (empresa: EmpresaAdmin) => getTenantAccessMode({
    status: empresa.status,
    statusAprovacao: empresa.status_aprovacao
  });

  const onAlterarPlano = async (empresa: EmpresaAdmin, novoPlano: EmpresaAdmin['plano']) => {
    if (novoPlano === empresa.plano) {
      return;
    }

    const motivo = window.prompt('Motivo da mudança de plano:') ?? undefined;
    if (!motivo) {
      return;
    }

    try {
      await alterarPlano(empresa.id, novoPlano, motivo);
      await carregar();
    } catch (actionError) {
      window.alert(getErrorMessage(actionError, 'Não foi possível alterar plano.'));
    }
  };

  const onAlterarModoAcesso = async (empresa: EmpresaAdmin, modo: 'ativo' | 'suspenso' | 'bloqueado') => {
    const label = modo === 'ativo' ? 'reativar' : modo === 'suspenso' ? 'suspender' : 'bloquear totalmente';
    const observacoes = window.prompt(`Observações para ${label} a empresa:`) ?? undefined;

    if (modo !== 'ativo' && !observacoes) {
      return;
    }

    try {
      await alterarModoAcessoEmpresa(empresa.id, modo, observacoes);
      await carregar();
    } catch (actionError) {
      window.alert(getErrorMessage(actionError, 'Não foi possível alterar o modo de acesso.'));
    }
  };

  const onAprovarOuReprovar = async (empresa: EmpresaAdmin, aprovado: boolean) => {
    const motivo = !aprovado ? window.prompt('Motivo da reprovação:') ?? undefined : undefined;

    if (!aprovado && !motivo) {
      return;
    }

    try {
      await aprovarEmpresa(empresa.id, aprovado, motivo);
      await carregar();
    } catch (actionError) {
      window.alert(getErrorMessage(actionError, 'Falha ao atualizar aprovação.'));
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-2xl border border-slate-700 bg-slate-800/80 p-5 shadow-lg md:grid-cols-[1fr_auto_auto_auto]">
        <Input
          placeholder="Buscar por nome, email, slug ou CNPJ"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          icon={<Search className="h-4 w-4 text-gray-400" />}
        />
        <select
          className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-gray-100"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="trial">Trial</option>
        </select>
        <Button variant="secondary" onClick={() => void carregar()}>
          Filtrar
        </Button>
        <div className="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-gray-300">
          {totalAtivas}/{empresas.length} ativas
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>}

      <section className="rounded-2xl border border-slate-700 bg-slate-800/80 shadow-lg">
        {loading ? (
          <p className="px-5 py-6 text-sm text-gray-400">Carregando empresas...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Aprovação</th>
                  <th className="px-5 py-3">Cadastro</th>
                  <th className="px-5 py-3">Data aprovação</th>
                  <th className="px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="text-gray-300">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-100">{empresa.nome_fantasia}</p>
                      <p className="text-xs text-gray-500">{empresa.slug}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p>{empresa.email_contato}</p>
                      <p className="text-xs text-gray-500">{empresa.telefone ?? 'Sem telefone'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-gray-100"
                        value={empresa.plano}
                        onChange={(event) => void onAlterarPlano(empresa, event.target.value as EmpresaAdmin['plano'])}
                      >
                        {planos.map((plano) => (
                          <option key={plano} value={plano}>
                            {planoLabel[plano]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${getEmpresaAccessMode(empresa) === 'full' ? 'bg-emerald-900/30 text-emerald-300' : getEmpresaAccessMode(empresa) === 'read-only' ? 'bg-amber-900/30 text-amber-300' : 'bg-rose-900/30 text-rose-300'}`}>
                        {getTenantAccessLabel(getEmpresaAccessMode(empresa))}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${empresa.status_aprovacao === 'aprovada' ? 'bg-emerald-900/30 text-emerald-300' : empresa.status_aprovacao === 'pendente' ? 'bg-amber-900/30 text-amber-300' : 'bg-rose-900/30 text-rose-300'}`}>
                        {empresa.status_aprovacao}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {formatDateTimeSafe(empresa.data_cadastro_formatada ?? empresa.criado_em)}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {formatDateTimeSafe(empresa.data_aprovacao_formatada ?? empresa.data_aprovacao)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {empresa.status_aprovacao === 'pendente' ? (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => void onAprovarOuReprovar(empresa, true)}>
                              Aprovar
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => void onAprovarOuReprovar(empresa, false)}>
                              Reprovar
                            </Button>
                          </>
                        ) : getEmpresaAccessMode(empresa) === 'full' ? (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => void onAlterarModoAcesso(empresa, 'suspenso')}>
                              <span className="flex items-center gap-2">
                                <PauseCircle className="h-4 w-4" />
                                Suspender
                              </span>
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => void onAlterarModoAcesso(empresa, 'bloqueado')}>
                              <span className="flex items-center gap-2">
                                <Ban className="h-4 w-4" />
                                Bloqueio total
                              </span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="success" onClick={() => void onAlterarModoAcesso(empresa, 'ativo')}>
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Reativar
                              </span>
                            </Button>
                            {getEmpresaAccessMode(empresa) !== 'blocked' && (
                              <Button size="sm" variant="danger" onClick={() => void onAlterarModoAcesso(empresa, 'bloqueado')}>
                                <span className="flex items-center gap-2">
                                  <Ban className="h-4 w-4" />
                                  Bloqueio total
                                </span>
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
