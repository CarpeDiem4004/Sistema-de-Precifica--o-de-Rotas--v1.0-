import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Eye, EyeOff, KeyRound, Truck } from 'lucide-react';
import { Button } from '../components/Forms/Button';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const fieldClassName =
  'mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

type Status = 'aguardando' | 'pronto' | 'sucesso' | 'erro-sessao';

export function RedefinirSenha() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('aguardando');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('erro-sessao');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('pronto');
      }
    });

    // Se o usuário já tem sessão ativa com token de recovery na URL
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus('pronto');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!supabase) {
      setError('Supabase não configurado.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });

      if (updateError) {
        throw updateError;
      }

      setStatus('sucesso');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao redefinir senha.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'aguardando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,_#dbeafe_0%,_#eff6ff_40%,_#f8fafc_100%)] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-600">Validando link de redefinição...</p>
        </div>
      </div>
    );
  }

  if (status === 'erro-sessao') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,_#dbeafe_0%,_#eff6ff_40%,_#f8fafc_100%)] px-4">
        <div className="mx-auto max-w-md rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-2xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-bold text-slate-900">Link inválido ou expirado</h2>
          <p className="mt-2 text-sm text-slate-600">
            Este link de redefinição é inválido ou já expirou. Solicite um novo link.
          </p>
          <button
            type="button"
            onClick={() => navigate('/esqueceu-senha')}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Solicitar novo link
          </button>
        </div>
      </div>
    );
  }

  if (status === 'sucesso') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,_#dbeafe_0%,_#eff6ff_40%,_#f8fafc_100%)] px-4">
        <div className="mx-auto max-w-md rounded-[2rem] border border-green-200 bg-white p-8 text-center shadow-2xl">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h2 className="text-xl font-bold text-slate-900">Senha redefinida!</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sua nova senha foi salva com sucesso. Agora você pode fazer login.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,_#dbeafe_0%,_#eff6ff_40%,_#f8fafc_100%)] px-4 py-12">
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-100">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-slate-950 p-3 text-blue-300">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-950">Criar nova senha</h1>
          <p className="mt-2 text-sm text-slate-600">Escolha uma senha segura para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">Nova senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className={fieldClassName + ' pr-12'}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Confirmar nova senha</label>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className={fieldClassName}
              placeholder="Repita a nova senha"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <span className="flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5" />
              Salvar nova senha
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}
