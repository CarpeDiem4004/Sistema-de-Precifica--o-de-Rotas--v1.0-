import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, Mail, Truck } from 'lucide-react';
import { Button } from '../components/Forms/Button';
import { useAuth } from '../contexts/AuthContext';

const fieldClassName =
  'mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

export function EsqueceuSenha() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setEnviado(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar email.';
      setError(msg);
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
          <h1 className="text-3xl font-black text-slate-950">Esqueceu a senha?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Informe seu email e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        {enviado ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-none text-green-600" />
              <div>
                <p className="font-semibold">Email enviado!</p>
                <p className="mt-1">
                  Verifique a caixa de entrada de <strong>{email}</strong> e clique no link para criar
                  sua nova senha. O link expira em 1 hora.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </button>
          </div>
        ) : (
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
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClassName}
                placeholder="voce@empresa.com.br"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              <span className="flex items-center justify-center gap-2">
                <Mail className="h-5 w-5" />
                Enviar link de redefinição
              </span>
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 text-sm text-slate-500 transition hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
