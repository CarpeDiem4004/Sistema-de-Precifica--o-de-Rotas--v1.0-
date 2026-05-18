import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle2, Sparkles, Truck } from 'lucide-react';
import { Button } from '../components/Forms/Button';
import { useAuth } from '../contexts/AuthContext';
import { buildTenantPath } from '../lib/tenant';

const fieldClassName = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

export function CadastroEmpresa() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    empresaNome: '',
    empresaSlug: '',
    cnpj: '',
    telefone: ''
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const normalizedEmail = formData.email.trim().toLowerCase();

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      setError('Informe um email válido (ex: nome@empresa.com).');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formData.empresaSlug)) {
      setError('O slug deve conter apenas letras minúsculas, números e hífens.');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        nome: formData.nome,
        email: normalizedEmail,
        password: formData.senha,
        empresaNome: formData.empresaNome,
        empresaSlug: formData.empresaSlug,
        cnpj: formData.cnpj || undefined,
        telefone: formData.telefone || undefined
      });

      if (result.requiresEmailConfirmation) {
        setSuccessMessage('Cadastro enviado. A empresa já foi provisionada e está disponível para aprovação no painel admin. Agora confirme o email para concluir o acesso do usuário.');
      } else {
        navigate(buildTenantPath(result.empresaSlug, '/dashboard'), { replace: true });
      }
    } catch (submitError) {
      const msg =
        submitError instanceof Error
          ? submitError.message
          : (submitError as { message?: string })?.message ?? 'Erro ao criar empresa.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.20),_transparent_30%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_100%)] px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/40">
          <div className="inline-flex rounded-2xl bg-white/10 p-3 text-cyan-300">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight">Crie o tenant da sua operação.</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
            Cada empresa recebe isolamento de dados, autenticação própria e espaço separado para bases, rotas e custos globais.
          </p>

          <div className="mt-8 space-y-4">
            {[
              'Slug exclusivo para identificar a empresa',
              'RLS no banco para bloquear acesso cruzado',
              'Provisionamento automático de custos globais'
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-100">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">Novo tenant</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Cadastro da empresa</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Responsável</label>
                <input className={fieldClassName} value={formData.nome} onChange={(event) => setFormData((prev) => ({ ...prev, nome: event.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input type="email" className={fieldClassName} value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Nome da empresa</label>
                <input className={fieldClassName} value={formData.empresaNome} onChange={(event) => setFormData((prev) => ({ ...prev, empresaNome: event.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Slug do tenant</label>
                <div className="mt-1 flex items-center rounded-xl border border-slate-300 bg-white px-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent px-3 py-3 text-slate-900 outline-none"
                    value={formData.empresaSlug}
                    onChange={(event) => setFormData((prev) => ({ ...prev, empresaSlug: event.target.value.toLowerCase().trim() }))}
                    placeholder="transportadora-alpha"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Usado em rotas do tipo /slug/dashboard e em subdomínio dedicado.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">CNPJ</label>
                <input className={fieldClassName} value={formData.cnpj} onChange={(event) => setFormData((prev) => ({ ...prev, cnpj: event.target.value }))} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Telefone</label>
                <input className={fieldClassName} value={formData.telefone} onChange={(event) => setFormData((prev) => ({ ...prev, telefone: event.target.value }))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Senha</label>
                <input type="password" className={fieldClassName} value={formData.senha} onChange={(event) => setFormData((prev) => ({ ...prev, senha: event.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Confirmar senha</label>
                <input type="password" className={fieldClassName} value={formData.confirmarSenha} onChange={(event) => setFormData((prev) => ({ ...prev, confirmarSenha: event.target.value }))} required />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Criar empresa
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Já tem acesso?{' '}
            <button type="button" onClick={() => navigate('/login')} className="font-semibold text-blue-700 hover:text-blue-800">
              Fazer login
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
