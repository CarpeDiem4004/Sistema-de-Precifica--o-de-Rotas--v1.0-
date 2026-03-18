import React from 'react';
import { Truck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 shadow-lg border-b border-slate-700 relative z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Truck className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold text-gray-100">Precificador de Rotas</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">João Paulo</span>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            JP
          </div>
        </div>
      </div>
    </header>
  );
};
