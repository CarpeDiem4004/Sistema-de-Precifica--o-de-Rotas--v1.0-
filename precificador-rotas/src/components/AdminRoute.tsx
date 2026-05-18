import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { buildTenantPath } from '../lib/tenant';

function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-400" />
    </div>
  );
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, empresa, loading, isSystemAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AdminLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isSystemAdmin) {
    const fallback = buildTenantPath(empresa?.slug ?? null, '/dashboard');
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
