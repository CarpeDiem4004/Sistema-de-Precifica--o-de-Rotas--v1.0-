import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, ChartColumnBig, Bell, ShieldAlert } from 'lucide-react';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: ChartColumnBig },
  { to: '/admin/empresas', label: 'Empresas', icon: Building2 },
  { to: '/admin/logs', label: 'Logs', icon: ShieldAlert },
  { to: '/admin/notificacoes', label: 'Notificações', icon: Bell }
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Painel Administrativo</h1>
            <p className="text-sm text-gray-400">Gestão global de empresas, assinaturas e operação da plataforma.</p>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-600 bg-slate-900/60 text-gray-300 hover:border-slate-500 hover:text-gray-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </div>
      </section>

      {children}
    </div>
  );
}
