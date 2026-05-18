import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, CheckCircle2, Clock3, Users, Waypoints } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../../components/Forms/Button';
import { aprovarEmpresa, getAdminDashboard, getEmpresasPendentes, type DashboardData, type EmpresaPendente } from '../../services/adminService';

const defaultDashboard: DashboardData = {
  total_empresas: 0,
  empresas_ativas: 0,
  empresas_trial: 0,
  empresas_pendentes: 0,
  total_usuarios: 0,
  total_operacoes: 0,
  faturamento_mensal: 0
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData>(defaultDashboard);
  const [pendentes, setPendentes] = useState<EmpresaPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [dashData, pendentesData] = await Promise.all([getAdminDashboard(), getEmpresasPendentes()]);
      setDashboard(dashData ?? defaultDashboard);
      setPendentes(pendentesData);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Erro ao carregar dashboard administrativo.'));
    } finally {
      setLoading(false);
    }
  };

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return (error as { message?: string })?.message ?? fallback;
}
  useEffect(() => {
    void load();
  }, []);

  const processarAprovacao = async (empresaId: string, aprovado: boolean) => {
    let motivo: string | undefined;

    if (!aprovado) {
      motivo = window.prompt('Informe o motivo da reprovação:') ?? undefined;
      if (!motivo) {
        return;
      }
    }

    try {
      await aprovarEmpresa(empresaId, aprovado, motivo);
      navigate('/admin/empresas', { replace: true });
    } catch (actionError) {
      setError(getErrorMessage(actionError, 'Falha ao processar aprovação.'));
    }
  };

  const cards = [
    { title: 'Empresas', value: dashboard.total_empresas, icon: Building2, color: 'text-blue-300' },
    { title: 'Ativas', value: dashboard.empresas_ativas, icon: CheckCircle2, color: 'text-emerald-300' },
    { title: 'Trial', value: dashboard.empresas_trial, icon: Clock3, color: 'text-amber-300' },
    { title: 'Pendentes', value: dashboard.empresas_pendentes, icon: AlertTriangle, color: 'text-rose-300' },
    { title: 'Usuários', value: dashboard.total_usuarios, icon: Users, color: 'text-cyan-300' },
    { title: 'Operações', value: dashboard.total_operacoes, icon: Waypoints, color: 'text-indigo-300' }
  ];

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando painel administrativo...</p>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{card.title}</p>
                  <p className="mt-1 text-3xl font-bold text-gray-100">{card.value}</p>
                </div>
                <Icon className={`h-7 w-7 ${card.color}`} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-800/80 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-100">Empresas aguardando aprovação</h2>
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Atualizar
          </Button>
        </div>

        {pendentes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-emerald-300">Nenhuma empresa pendente no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Cadastro</th>
                  <th className="px-5 py-3">Pendência</th>
                  <th className="px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {pendentes.map((empresa) => (
                  <tr key={empresa.empresa_id} className="text-gray-300">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-100">{empresa.nome_fantasia}</p>
                      <p className="text-xs text-gray-500">{empresa.slug}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p>{empresa.email_contato}</p>
                      <p className="text-xs text-gray-500">{empresa.telefone ?? 'Sem telefone'}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {format(new Date(empresa.data_cadastro), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${empresa.dias_pendente > 7 ? 'bg-red-900/40 text-red-300' : 'bg-amber-900/40 text-amber-300'}`}>
                        {empresa.dias_pendente} dias
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => void processarAprovacao(empresa.empresa_id, true)}>
                          Aprovar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => void processarAprovacao(empresa.empresa_id, false)}>
                          Reprovar
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => navigate('/admin/empresas')}>
                          Ver lista
                        </Button>
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
