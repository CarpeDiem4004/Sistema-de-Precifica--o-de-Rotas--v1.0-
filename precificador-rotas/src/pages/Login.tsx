import { useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, LogIn, Truck } from 'lucide-react';
import { Button } from '../components/Forms/Button';
import { useAuth } from '../contexts/AuthContext';
import { buildTenantPath, getCurrentTenantSlug } from '../lib/tenant';

type LocationState = {
  from?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  const message = (error as { message?: string })?.message;
  if (message && message.trim()) {
    return message;
  }

  return fallback;
}

const fieldClassName = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const empresaSlug = useMemo(() => getCurrentTenantSlug(), []);
  const from = (location.state as LocationState | null)?.from;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { empresa, isSystemAdmin } = await signIn(email, senha);
      if (isSystemAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else if (!empresa) {
        const shouldTryAdmin = Boolean(from?.startsWith('/admin')) || !empresaSlug;
        if (shouldTryAdmin) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          setError('Seu usuário não possui perfil vinculado. Solicite acesso ao administrador do sistema.');
        }
      } else if (from && !from.startsWith('/admin')) {
        navigate(from, { replace: true });
      } else {
        navigate(buildTenantPath(empresa.slug ?? empresaSlug, '/dashboard'), { replace: true });
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Erro ao fazer login.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,_#dbeafe_0%,_#eff6ff_40%,_#f8fafc_100%)] px-4 py-12">
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-100">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-slate-950 p-3 text-blue-300">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-950">Entrar na plataforma</h1>
          <p className="mt-2 text-sm text-slate-600">
            {empresaSlug ? `Tenant identificado: ${empresaSlug}` : 'Acesse com seu email e senha.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClassName}
              placeholder="voce@empresa.com.br"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className={fieldClassName}
              placeholder="Sua senha"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <span className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Entrar
            </span>
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/esqueceu-senha')}
              className="text-sm text-slate-500 hover:text-blue-700 transition"
            >
              Esqueceu sua senha?
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Não tem conta?{' '}
          <button type="button" onClick={() => navigate('/cadastro')} className="font-semibold text-blue-700 hover:text-blue-800">
            Criar empresa
          </button>
        </div>
      </div>
    </div>
  );
}
