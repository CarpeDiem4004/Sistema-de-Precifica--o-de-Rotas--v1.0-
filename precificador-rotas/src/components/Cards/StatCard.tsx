import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  subtitle?: string;
  onClick?: () => void;
}

const colorMap = {
  blue: 'bg-blue-900/50 text-blue-400',
  green: 'bg-green-900/50 text-green-400',
  yellow: 'bg-yellow-900/50 text-yellow-400',
  red: 'bg-red-900/50 text-red-400',
  purple: 'bg-purple-900/50 text-purple-400',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'blue',
  subtitle,
  onClick
}) => {
  return (
    <div
      className={`bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700 ${onClick ? 'cursor-pointer hover:border-slate-500 transition-colors' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-100">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
