const PUBLIC_SEGMENTS = new Set(['', 'login', 'cadastro', 'admin']);

function getBrowserLocation() {
  if (typeof window === 'undefined') {
    return {
      hostname: '',
      pathname: '/'
    };
  }

  return {
    hostname: window.location.hostname,
    pathname: window.location.pathname
  };
}

export function getSubdomainTenantSlug(hostname = getBrowserLocation().hostname): string | null {
  if (!hostname) {
    return null;
  }

  if (hostname.endsWith('.localhost') || hostname.endsWith('.lvh.me')) {
    const parts = hostname.split('.');
    return parts[0] || null;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  const parts = hostname.split('.');
  return parts.length > 2 ? parts[0] : null;
}

export function getPathTenantSlug(pathname = getBrowserLocation().pathname): string | null {
  const [firstSegment] = pathname.split('/').filter(Boolean);

  if (!firstSegment || PUBLIC_SEGMENTS.has(firstSegment)) {
    return null;
  }

  return firstSegment;
}

export function getCurrentTenantSlug(): string | null {
  return getSubdomainTenantSlug() ?? getPathTenantSlug();
}

export const getEmpresaSlug = getCurrentTenantSlug;

export function buildTenantPath(slug: string | null | undefined, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (getSubdomainTenantSlug()) {
    return normalizedPath;
  }

  if (!slug) {
    return normalizedPath;
  }

  if (normalizedPath === '/') {
    return `/${slug}`;
  }

  return `/${slug}${normalizedPath}`;
}

export function stripTenantFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return '/';
  }

  if (PUBLIC_SEGMENTS.has(segments[0])) {
    return pathname;
  }

  if (segments.length === 1) {
    return '/dashboard';
  }

  return `/${segments.slice(1).join('/')}`;
}
