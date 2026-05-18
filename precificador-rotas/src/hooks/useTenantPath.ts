import { useAuth } from '../contexts/AuthContext';
import { buildTenantPath } from '../lib/tenant';

export function useTenantPath() {
  const { empresa } = useAuth();

  return (path: string) => buildTenantPath(empresa?.slug ?? null, path);
}
