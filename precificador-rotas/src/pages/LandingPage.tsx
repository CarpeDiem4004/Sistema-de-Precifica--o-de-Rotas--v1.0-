import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Route,
  TrendingUp,
  Truck,
} from 'lucide-react';

const features = [
  {
    icon: DollarSign,
    title: 'Custo real por rota',
    description:
      'Combustível, pedágio, motorista e despesas variáveis calculados automaticamente. Você apresenta o preço certo, sem chute.',
  },
  {
    icon: TrendingUp,
    title: 'Margem sempre no controle',
    description:
      'Defina o lucro mínimo aceitável e veja em tempo real se o negócio fecha no verde. Nunca mais venda abaixo do custo.',
  },
  {
    icon: BarChart3,
    title: 'Visão completa do negócio',
    description:
      'Acompanhe rentabilidade por cliente, por rota e por período. Dados claros para decisões mais rápidas e seguras.',
  },
];

const diferenciais = [
  'Proposta de preço em minutos',
  'Histórico de todas as operações',
  'Controle de custos variáveis',
  'Relatórios de rentabilidade',
  'Acesso via web, em qualquer lugar',
  'Sem planilhas, sem retrabalho',
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/60">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Precificador de Rotas</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500"
            >
              Criar conta
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:pb-32 lg:pt-28">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Texto */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
                <Route className="h-4 w-4" />
                Gestão de fretes e rentabilidade
              </div>

              <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-white lg:text-6xl">
                Precifique cada rota{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  com margem garantida.
                </span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-slate-400">
                Calcule automaticamente todos os custos de cada operação — combustível, pedágio,
                motorista e despesas variáveis — e apresente propostas com total confiança e
                lucratividade.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/cadastro')}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-blue-900/50 transition hover:bg-blue-500 hover:shadow-blue-800/60"
                >
                  Começar gratuitamente
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Já tenho acesso
                </button>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
                {['Sem custo inicial', 'Configuração em minutos', 'Suporte incluso'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle2 className="h-4 w-4 flex-none text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Card dashboard */}
            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl">
                <div className="rounded-[1.4rem] bg-slate-900 p-6">
                  {/* Header do card */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Painel operacional
                      </p>
                      <p className="mt-1 text-base font-bold text-white">Transportadora Alpha</p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Ativo
                    </span>
                  </div>

                  {/* Métricas */}
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Margem média', value: '34,2%', color: 'text-blue-400' },
                      { label: 'Rotas no mês', value: '126', color: 'text-white' },
                      { label: 'Lucro gerado', value: 'R$ 48.500', color: 'text-emerald-400' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-2xl bg-white/5 p-3">
                        <p className="mb-1 text-xs text-slate-500">{m.label}</p>
                        <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Operações recentes */}
                  <div className="space-y-2">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Operações recentes
                    </p>
                    {[
                      { rota: 'SP → RJ', cliente: 'Cliente ABC', margem: '42%', valor: 'R$ 3.200', cor: 'text-emerald-400' },
                      { rota: 'SP → BH', cliente: 'Cliente DEF', margem: '28%', valor: 'R$ 2.850', cor: 'text-blue-400' },
                      { rota: 'SP → Curitiba', cliente: 'Cliente GHI', margem: '35%', valor: 'R$ 4.100', cor: 'text-emerald-400' },
                    ].map((op) => (
                      <div
                        key={op.rota}
                        className="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{op.rota}</p>
                          <p className="text-xs text-slate-500">{op.cliente}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${op.cor}`}>{op.margem}</p>
                          <p className="text-xs text-slate-500">{op.valor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Badge flutuante */}
              <div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 shadow-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Lucro identificado</p>
                  <p className="text-sm font-bold text-emerald-400">+R$ 48.500 / mês</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section className="border-y border-white/5 bg-white/2">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {diferenciais.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 flex-none text-blue-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white lg:text-5xl">
            Tudo que sua operação precisa,
            <br />
            <span className="text-slate-400">em um só lugar.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500">
            Do cálculo do frete até o acompanhamento de rentabilidade — sem planilhas, sem
            retrabalho, sem margem para erro.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className="group rounded-3xl border border-white/8 bg-white/4 p-8 transition hover:border-blue-500/30 hover:bg-white/6"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400 transition group-hover:bg-blue-600/25">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Números ── */}
      <section className="border-y border-white/5 bg-gradient-to-r from-blue-950/40 to-slate-900/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 text-center md:grid-cols-3">
            {[
              { value: '< 5 min', label: 'Para precificar uma rota completa', icon: Clock },
              { value: 'Zero', label: 'Planilhas ou ferramentas externas', icon: CheckCircle2 },
              { value: '100%', label: 'Dos custos calculados automaticamente', icon: BarChart3 },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center">
                  <Icon className="mb-3 h-6 w-6 text-blue-400" />
                  <p className="text-4xl font-black text-white">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center">
        <h2 className="text-4xl font-black tracking-tight text-white lg:text-5xl">
          Comece a precificar com{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            inteligência hoje.
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
          Cadastre sua empresa e em minutos tenha controle total sobre custos, margens e
          rentabilidade de cada rota que você opera.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/cadastro')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-blue-900/50 transition hover:bg-blue-500"
          >
            Criar minha conta gratuitamente
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Já tenho acesso
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Truck className="h-4 w-4" />
            Precificador de Rotas
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Carpe Diem Transportes. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
