import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  MapPin,
  TrendingUp
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/nova-operacao', label: 'Nova Operação', icon: PlusCircle },
  { path: '/lista-rotas', label: 'Lista de Rotas', icon: List },
  { path: '/custos-globais', label: 'Custos Globais', icon: TrendingUp },
  { path: '/bases', label: 'Bases', icon: MapPin },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 h-[calc(100vh-73px)] relative z-10">
      <nav className="p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
