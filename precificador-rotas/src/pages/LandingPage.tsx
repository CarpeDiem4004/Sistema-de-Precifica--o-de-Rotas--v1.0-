import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Calculator, CheckCircle2, MapPinned, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '../components/Forms/Button';

const benefits = [
  {
    icon: Calculator,
    title: 'Precificação realista',
    description: 'Combustível, motorista, pedágio e margem em uma única operação.'
  },
  {
    icon: ShieldCheck,
    title: 'Isolamento por empresa',
    description: 'Cada cliente acessa apenas as bases, custos e rotas do seu tenant.'
  },
  {
    icon: MapPinned,
    title: 'Operação guiada',
    description: 'Origem, destino e cálculo de distância conectados ao fluxo comercial.'
  }
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white shadow-lg shadow-slate-300">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">SaaS Logístico</p>
              <h1 className="text-lg font-bold text-slate-900">Precificador de Rotas</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/cadastro')}>
              Criar empresa
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Building2 className="h-4 w-4" />
              Multi-tenant com Supabase e isolamento por empresa
            </p>
            <h2 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950">
              Venda rotas com margem controlada e operação segmentada por tenant.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Cadastre empresas, autentique usuários, isole dados com RLS e opere cada cliente em um ambiente lógico próprio.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate('/cadastro')}>
                <span className="flex items-center gap-2">
                  Começar agora
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
                Já tenho acesso
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {['Setup em minutos', 'Tenant isolado', 'Deploy via Vercel'].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-2xl shadow-slate-400/30">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.28em] text-blue-300">Resumo operacional</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Tenant ativo</p>
                  <p className="mt-1 text-2xl font-bold">transportadora-alpha</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-blue-500/10 p-4">
                    <p className="text-sm text-blue-200">Margem média</p>
                    <p className="mt-1 text-2xl font-bold text-white">18.4%</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-200">Rotas aprovadas</p>
                    <p className="mt-1 text-2xl font-bold text-white">126</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                  RLS no Supabase garante que cada usuário veja apenas os dados vinculados à própria empresa.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title} className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-300/20 backdrop-blur-sm">
                <div className="mb-4 inline-flex rounded-2xl bg-slate-950 p-3 text-blue-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{benefit.description}</p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
