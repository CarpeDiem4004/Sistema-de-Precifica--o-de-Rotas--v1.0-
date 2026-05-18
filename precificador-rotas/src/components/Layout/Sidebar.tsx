import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  List,
  MapPin,
  TrendingUp,
  UserCog,
  Truck,
  FileText,
  LogOut,
} from 'lucide-react';
import { useTenantPath } from '../../hooks/useTenantPath';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/nova-operacao', label: 'Nova Operação', icon: PlusCircle },
  { path: '/lista-rotas', label: 'Lista de Rotas', icon: List },
  { path: '/registro-execucao', label: 'Registrar Execução', icon: Truck },
  { path: '/relatorio-rentabilidade', label: 'Relatório', icon: FileText },
  { path: '/custos-globais', label: 'Custos Globais', icon: TrendingUp },
  { path: '/bases', label: 'Bases', icon: MapPin },
  { path: '/equipe', label: 'Equipe', icon: UserCog, adminOnly: true },
];

export const Sidebar: React.FC = () => {
  const tenantPath = useTenantPath();
  const navigate = useNavigate();
  const { isAdmin, signOut, perfil, empresa } = useAuth();

  const visibleItems = menuItems.filter((item) => !item.adminOnly || isAdmin);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-0 top-[73px] w-64 bg-slate-800 border-r border-slate-700 z-20 flex flex-col" style={{ height: 'calc(100vh - 73px)' }}>
      {/* Itens de navegação — rolam se necessário */}
      <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-600">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={tenantPath(item.path)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                }`
              }
              end={item.path === '/dashboard'}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Rodapé fixo — usuário + logout sempre visíveis */}
      <div className="shrink-0 border-t border-slate-700 p-4 space-y-1">
        <div className="px-4 py-2 rounded-lg bg-slate-700/40">
          <p className="text-xs font-semibold text-gray-200 truncate">{perfil?.nome ?? 'Usuário'}</p>
          <p className="text-xs text-gray-500 truncate">{empresa?.nome_fantasia ?? ''}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};
