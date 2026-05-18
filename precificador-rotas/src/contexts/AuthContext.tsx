import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { checkSystemAdmin } from '../services/adminService';
import { getTenantAccessMode, type EmpresaAprovacaoStatus, type TenantAccessMode } from '../lib/tenantAccess';

export interface Empresa {
  id: string;
  slug: string;
  nome_fantasia: string;
  plano: string;
  status: string;
  status_aprovacao?: EmpresaAprovacaoStatus | null;
}

export interface UsuarioPerfil {
  id: string;
  auth_user_id: string;
  empresa_id: string;
  nome: string;
  email: string;
  cargo: string;
  status: string;
}

type SignUpPayload = {
  nome: string;
  email: string;
  password: string;
  empresaNome: string;
  empresaSlug: string;
  cnpj?: string;
  telefone?: string;
  conviteToken?: string;
};

type SignUpResult = {
  requiresEmailConfirmation: boolean;
  empresaSlug: string;
};

type SignInResult = {
  empresa: Empresa | null;
  isSystemAdmin: boolean;
};

type AuthContextType = {
  user: User | null;
  empresa: Empresa | null;
  perfil: UsuarioPerfil | null;
  loading: boolean;
  isAdmin: boolean;
  isSystemAdmin: boolean;
  accessMode: TenantAccessMode;
  canEdit: boolean;
  isSuspended: boolean;
  isBlocked: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (payload: SignUpPayload) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

type PerfilComEmpresa = {
  perfil: UsuarioPerfil;
  empresa: Empresa;
};

type AuthResolvedState = {
  user: User;
  empresa: Empresa | null;
  perfil: UsuarioPerfil | null;
  adminDb: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
  }

  return supabase;
}

function isEnvSystemAdmin(email?: string | null) {
  const raw = (import.meta.env.VITE_ADMIN_EMAILS ?? '') as string;
  const list = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return !!email && list.includes(email.toLowerCase());
}

async function ensureSignupBootstrap(user: User) {
  const client = ensureSupabase();
  const metadata = user.user_metadata ?? {};

  if (metadata.convite_token && metadata.nome) {
    const { error } = await client.rpc('accept_invite', {
      p_token: metadata.convite_token,
      p_nome: metadata.nome
    });

    if (error && !String(error.message || '').includes('já utilizado')) {
      throw error;
    }
  }

  if (!metadata.empresa_slug || !metadata.empresa_nome || !metadata.nome) {
    return;
  }

  const { error } = await client.rpc('bootstrap_empresa_admin', {
    p_nome: metadata.nome,
    p_empresa_nome: metadata.empresa_nome,
    p_empresa_slug: metadata.empresa_slug,
    p_email: user.email ?? metadata.email ?? '',
    p_cnpj: metadata.cnpj ?? null,
    p_telefone: metadata.telefone ?? null
  });

  if (error) {
    throw error;
  }
}

async function carregarPerfil(authUserId: string): Promise<PerfilComEmpresa | null> {
  const client = ensureSupabase();
  const currentUser = (await client.auth.getUser()).data.user;

  if (currentUser) {
    await ensureSignupBootstrap(currentUser);
  }

  const { data: perfilData, error: perfilError } = await client
    .from('usuarios')
    .select('id, auth_user_id, empresa_id, nome, email, cargo, status')
    .eq('auth_user_id', authUserId)
    .maybeSingle<UsuarioPerfil>();

  if (perfilError) {
    throw perfilError;
  }

  if (!perfilData) {
    return null;
  }

  const { data: empresaData, error: empresaError } = await client
    .from('empresas')
    .select('id, slug, nome_fantasia, plano, status')
    .eq('id', perfilData.empresa_id)
    .single<Empresa>();

  if (empresaError) {
    throw empresaError;
  }

  const { data: aprovacaoData, error: aprovacaoError } = await client
    .from('empresas_aprovacao')
    .select('status_aprovacao')
    .eq('empresa_id', perfilData.empresa_id)
    .maybeSingle<{ status_aprovacao: EmpresaAprovacaoStatus | null }>();

  if (aprovacaoError) {
    throw aprovacaoError;
  }

  return {
    perfil: perfilData,
    empresa: {
      ...empresaData,
      status_aprovacao: aprovacaoData?.status_aprovacao ?? null
    }
  };
}

async function resolveAuthState(currentUser: User): Promise<AuthResolvedState> {
  const adminDb = await checkSystemAdmin(currentUser.id);
  const adminByEnv = isEnvSystemAdmin(currentUser.email);

  if (adminDb || adminByEnv) {
    return {
      user: currentUser,
      empresa: null,
      perfil: null,
      adminDb: adminDb || adminByEnv
    };
  }

  const loaded = await carregarPerfil(currentUser.id);

  return {
    user: currentUser,
    empresa: loaded?.empresa ?? null,
    perfil: loaded?.perfil ?? null,
    adminDb
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [systemAdminDb, setSystemAdminDb] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const client = ensureSupabase();
    const currentUser = (await client.auth.getUser()).data.user;

    if (!currentUser) {
      setUser(null);
      setEmpresa(null);
      setPerfil(null);
      setSystemAdminDb(false);
      return;
    }

    const resolved = await resolveAuthState(currentUser);
    setUser(resolved.user);
    setEmpresa(resolved.empresa);
    setPerfil(resolved.perfil);
    setSystemAdminDb(resolved.adminDb);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    // Garante que o loading sempre termina, mesmo que o Supabase demore ou trave
    const loadingTimeout = setTimeout(() => {
      if (active) setLoading(false);
    }, 8000);

    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (session?.user) {
          const resolved = await resolveAuthState(session.user);
          if (!active) {
            return;
          }
          setUser(resolved.user);
          setEmpresa(resolved.empresa);
          setPerfil(resolved.perfil);
          setSystemAdminDb(resolved.adminDb);
        }
      } catch {
        if (active) {
          setUser(null);
          setEmpresa(null);
          setPerfil(null);
        }
      } finally {
        clearTimeout(loadingTimeout);
        if (active) {
          setLoading(false);
        }
      }
    })();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      // SIGNED_IN e INITIAL_SESSION já são tratados por signIn() e getSession() acima.
      // Processar aqui causaria race condition (checkSystemAdmin retorna false no segundo disparo).
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        return;
      }

      // SIGNED_OUT: limpar estado imediatamente
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setEmpresa(null);
        setPerfil(null);
        setSystemAdminDb(false);
        setLoading(false);
        return;
      }

      // TOKEN_REFRESHED / USER_UPDATED: atualizar perfil em background sem spinner
      void (async () => {
        try {
          const resolved = await resolveAuthState(session.user);
          if (!active) return;
          setUser(resolved.user);
          setEmpresa(resolved.empresa);
          setPerfil(resolved.perfil);
          setSystemAdminDb(resolved.adminDb);
        } catch {
          // silencioso — não apaga estado existente
        }
      })();
    });

    return () => {
      active = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const client = ensureSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      return {
        empresa: null,
        isSystemAdmin: false
      };
    }

    const resolved = await resolveAuthState(data.user);
    setUser(resolved.user);
    setEmpresa(resolved.empresa);
    setPerfil(resolved.perfil);
    setSystemAdminDb(resolved.adminDb);

    return {
      empresa: resolved.empresa,
      isSystemAdmin: resolved.adminDb
    };
  };

  const signUp = async ({ nome, email, password, empresaNome, empresaSlug, cnpj, telefone, conviteToken }: SignUpPayload) => {
    const client = ensureSupabase();
    const normalizedSlug = empresaSlug.trim().toLowerCase();

    if (!conviteToken) {
      const { data: disponibilidade, error: disponibilidadeError } = await client.rpc('is_empresa_slug_available', {
        p_slug: normalizedSlug
      });

      if (disponibilidadeError) {
        throw disponibilidadeError;
      }

      if (!disponibilidade) {
        throw new Error('Este slug já está em uso. Escolha outro.');
      }
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: import.meta.env.VITE_APP_URL,
        data: {
          nome,
          empresa_nome: empresaNome,
          empresa_slug: normalizedSlug,
          cnpj: cnpj ?? null,
          telefone: telefone ?? null,
          convite_token: conviteToken ?? null,
          email
        }
      }
    });

    if (error) {
      throw error;
    }

    if (data.user && data.session) {
      await ensureSignupBootstrap(data.user);
      const loaded = await carregarPerfil(data.user.id);
      const adminDb = await checkSystemAdmin(data.user.id);
      setUser(data.user);
      setEmpresa(loaded?.empresa ?? null);
      setPerfil(loaded?.perfil ?? null);
      setSystemAdminDb(adminDb);
    }

    return {
      requiresEmailConfirmation: !data.session,
      empresaSlug: normalizedSlug
    };
  };

  const signOut = async () => {
    const client = ensureSupabase();
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setEmpresa(null);
    setPerfil(null);
    setSystemAdminDb(false);
  };

  const resetPassword = async (email: string) => {
    const client = ensureSupabase();
    const redirectTo = `${window.location.origin}/redefinir-senha`;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      throw error;
    }
  };

  const isSystemAdmin = systemAdminDb || isEnvSystemAdmin(user?.email);
  const accessMode = getTenantAccessMode({
    status: empresa?.status,
    statusAprovacao: empresa?.status_aprovacao,
    isSystemAdmin
  });
  const canEdit = accessMode === 'full';
  const isSuspended = accessMode === 'read-only';
  const isBlocked = accessMode === 'blocked';

  return (
    <AuthContext.Provider
      value={{
        user,
        empresa,
        perfil,
        loading,
        isAdmin: perfil?.cargo === 'admin',
        isSystemAdmin,
        accessMode,
        canEdit,
        isSuspended,
        isBlocked,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
