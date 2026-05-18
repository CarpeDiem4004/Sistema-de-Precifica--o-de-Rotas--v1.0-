import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { Button } from '../components/Forms/Button';
import { getConvitePublico } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { buildTenantPath } from '../lib/tenant';

export default function AceitarConvite() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invite, setInvite] = useState<Awaited<ReturnType<typeof getConvitePublico>>>(null);
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setLoadingInvite(true);
        const loaded = await getConvitePublico(token);
        setInvite(loaded);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar convite.');
      } finally {
        setLoadingInvite(false);
      }
    })();
  }, [token]);

  const conviteInvalido = useMemo(() => !invite || invite.usado_em || invite.expirado, [invite]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!invite) {
      setError('Convite não encontrado.');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await signUp({
        nome,
        email: invite.email,
        password: senha,
        empresaNome: invite.empresa_nome,
        empresaSlug: invite.empresa_slug,
        conviteToken: token
      });

      if (result.requiresEmailConfirmation) {
        setSuccess('Conta criada. Confirme o email e depois faça login para concluir o convite.');
      } else {
        navigate(buildTenantPath(invite.empresa_slug, '/dashboard'), { replace: true });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro ao aceitar convite.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvite) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">Carregando convite...</div>;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_100%)] px-4 py-12">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-100">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-slate-950 p-3 text-blue-300">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-950">Aceitar convite</h1>
          {invite && <p className="mt-2 text-sm text-slate-600">Empresa: {invite.empresa_nome}</p>}
        </div>

        {(error || success) && (
          <div className={`mb-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${error ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error ? <AlertCircle className="mt-0.5 h-5 w-5 flex-none" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" />}
            <span>{error || success}</span>
          </div>
        )}

        {conviteInvalido ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
            Este convite está inválido, expirado ou já foi utilizado.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input value={invite?.email || ''} disabled className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Nome</label>
              <input value={nome} onChange={(event) => setNome(event.target.value)} required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Senha</label>
              <input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Confirmar senha</label>
              <input type="password" value={confirmarSenha} onChange={(event) => setConfirmarSenha(event.target.value)} required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            </div>
            <Button type="submit" className="w-full" loading={submitting}>
              Criar acesso e entrar
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
