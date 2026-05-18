import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, MailPlus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { Button } from '../components/Forms/Button';
import { Select } from '../components/Forms/Select';
import { useEquipe } from '../hooks/useEquipe';
import { useAuth } from '../contexts/AuthContext';
import { useTenantPath } from '../hooks/useTenantPath';

export default function Equipe() {
  const navigate = useNavigate();
  const tenantPath = useTenantPath();
  const { empresa, canEdit, isSuspended } = useAuth();
  const { usuarios, convites, loading, error, isAdmin, convidar, revogar } = useEquipe();
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState<'admin' | 'operador' | 'visualizador'>('operador');
  const [success, setSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectBase = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return `${window.location.protocol}//${window.location.host}`;
  }, []);

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess('');
    setSubmitError('');
    setSubmitting(true);

    try {
      const result = await convidar(email, cargo, redirectBase);
      const inviteUrl = result?.link || `${redirectBase}${tenantPath(`/convites/${result?.token || ''}`)}`;
      setSuccess(`Convite criado para ${email}. Link: ${inviteUrl}`);
      setEmail('');
      setCargo('operador');
    } catch (inviteError) {
      setSubmitError(inviteError instanceof Error ? inviteError.message : 'Erro ao criar convite.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async (token: string) => {
    const inviteUrl = `${redirectBase}${tenantPath(`/convites/${token}`)}`;
    await navigator.clipboard.writeText(inviteUrl);
    setSuccess(`Link copiado: ${inviteUrl}`);
  };

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-700 bg-amber-950/30 p-6 text-amber-200">
        Apenas administradores podem gerenciar equipe e convites.
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate(tenantPath('/dashboard'))}>
            Voltar ao dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Equipe</h1>
          <p className="text-sm text-gray-400">Gerencie usuários e convites do tenant {empresa?.slug}.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-900/30 px-4 py-2 text-sm text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          Admin
        </div>
      </div>

      {(error || submitError || success) && (
        <div className={`rounded-xl px-4 py-3 text-sm ${error || submitError ? 'border border-red-800 bg-red-900/30 text-red-300' : 'border border-emerald-800 bg-emerald-900/30 text-emerald-300'}`}>
          {error || submitError || success}
        </div>
      )}

      {isSuspended && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          Empresa suspensa: usuários e convites continuam visíveis, mas criar ou revogar convites está bloqueado.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <MailPlus className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-100">Novo convite</h2>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-gray-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30"
                placeholder="usuario@empresa.com"
                required
                disabled={!canEdit}
              />
            </div>

            <Select
              label="Cargo"
              options={[
                { value: 'admin', label: 'Administrador' },
                { value: 'operador', label: 'Operador' },
                { value: 'visualizador', label: 'Visualizador' }
              ]}
              value={cargo}
              onChange={(event) => setCargo(event.target.value as 'admin' | 'operador' | 'visualizador')}
              className="bg-slate-700 text-gray-100 border-slate-600"
              disabled={!canEdit}
            />

            <Button type="submit" loading={submitting} disabled={!canEdit}>
              Criar convite
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-100">Usuários ativos</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-400">Carregando equipe...</p>
            ) : usuarios.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum usuário encontrado.</p>
            ) : (
              usuarios.map((usuario) => (
                <div key={usuario.id} className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-100">{usuario.nome}</p>
                      <p className="text-sm text-gray-400">{usuario.email}</p>
                    </div>
                    <div className="text-right text-sm text-gray-300">
                      <p>{usuario.cargo}</p>
                      <p className="text-xs text-gray-500">{usuario.status}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-100">Convites pendentes</h2>
        <div className="space-y-3">
          {convites.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum convite pendente.</p>
          ) : (
            convites.map((convite) => (
              <div key={convite.id} className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-gray-100">{convite.email}</p>
                  <p className="text-sm text-gray-400">Cargo: {convite.cargo} · expira em {new Date(convite.expira_em).toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => void handleCopy(convite.token)}>
                    <span className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Copiar link
                    </span>
                  </Button>
                  <Button variant="danger" onClick={() => void revogar(convite.id)} disabled={!canEdit}>
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Revogar
                    </span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
