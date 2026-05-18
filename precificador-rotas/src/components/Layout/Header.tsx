import React from 'react';
import { Shield, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const { empresa, perfil, isSystemAdmin } = useAuth();

  const initials = (perfil?.nome || empresa?.nome_fantasia || 'PR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
    .join('');

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-800 shadow-lg border-b border-slate-700 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Truck className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold text-gray-100">Precificador de Rotas</h1>
        </div>

        <div className="flex items-center gap-4">
          {isSystemAdmin && (
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-600/60 bg-blue-600/10 px-3 py-2 text-xs font-medium text-blue-300 transition hover:border-blue-500 hover:bg-blue-600/20"
            >
              <Shield className="h-4 w-4" />
              Painel Admin
            </Link>
          )}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {initials || 'PR'}
          </div>
        </div>
      </div>
    </header>
  );
};
