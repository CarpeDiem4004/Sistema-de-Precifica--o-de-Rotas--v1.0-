import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import RegistroExecucao from './pages/RegistroExecucao';
import { RelatorioRentabilidade } from './pages/RelatorioRentabilidade';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminRoute } from './components/AdminRoute';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { WorldMapBackground } from './components/WorldMapBackground';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { EsqueceuSenha } from './pages/EsqueceuSenha';
import { RedefinirSenha } from './pages/RedefinirSenha';
import { CadastroEmpresa } from './pages/CadastroEmpresa';
import Equipe from './pages/Equipe';
import AceitarConvite from './pages/AceitarConvite';
import Dashboard from './pages/Dashboard';
import NovaOperacao from './pages/NovaOperacao';
import ListaRotas from './pages/ListaRotas';
import CustosGlobais from './pages/CustosGlobais';
import BasesConfig from './pages/BasesConfig';
import { AdminLayout } from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmpresas from './pages/admin/AdminEmpresas';
import AdminLogs from './pages/admin/AdminLogs';
import AdminNotificacoes from './pages/admin/AdminNotificacoes';
import { buildTenantPath, getEmpresaSlug, getSubdomainTenantSlug, stripTenantFromPath } from './lib/tenant';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-red-950 flex-col gap-6">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-700 border-t-white" />
      <h1 className="text-3xl font-bold text-white">CARREGANDO...</h1>
      <p className="text-red-300 text-center max-w-md">
        Se você está vendo esta tela vermelha, o problema é que o AuthContext<br />
        está preso no estado de loading.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-white text-black rounded-lg font-medium"
      >
        Recarregar página
      </button>
    </div>
  );
}

function AppLayout({ children }: { children: ReactNode }) {
  const { isSuspended } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900">
      <WorldMapBackground />
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="main-content ml-64 mt-[73px] h-[calc(100vh-73px)] flex-1 overflow-y-auto p-6">
          {isSuspended && (
            <div className="mb-6 rounded-2xl border border-amber-700 bg-amber-950/30 px-5 py-4 text-sm text-amber-200">
              Empresa suspensa: acesso liberado apenas para consulta. Criacao, edicao e exclusao de dados estao desativadas ate a reativacao pelo administrador da plataforma.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function BlockedTenantScreen() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="max-w-xl rounded-2xl border border-red-800 bg-red-950/20 p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-red-200">Acesso bloqueado</h1>
        <p className="mt-3 text-sm text-red-100/80">
          Esta empresa foi bloqueada e nao pode acessar o sistema neste momento. Nenhum dado foi removido, mas o uso da plataforma esta indisponivel ate nova liberacao.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-6 rounded-lg border border-red-700 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-900/30"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900">
      <WorldMapBackground />
      <Header />
      <main className="relative z-10 mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, empresa, perfil, loading, isSystemAdmin, isBlocked } = useAuth();
  const location = useLocation();
  const params = useParams();
  const subdomainSlug = getSubdomainTenantSlug();
  const requestedSlug = params.slug ?? subdomainSlug;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isBlocked) {
    return <BlockedTenantScreen />;
  }

  // System admin sem empresa: redireciona para o painel admin
  if (isSystemAdmin && (!empresa || !perfil)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!empresa || !perfil) {
    // Usuário autenticado mas sem empresa (cadastro incompleto)
    return <Navigate to="/" replace />;
  }

  if (requestedSlug && requestedSlug !== empresa.slug) {
    return <Navigate to={buildTenantPath(empresa.slug, stripTenantFromPath(location.pathname))} replace />;
  }

  if (!requestedSlug && !subdomainSlug) {
    return <Navigate to={buildTenantPath(empresa.slug, location.pathname)} replace />;
  }

  return <>{children}</>;
}

function TenantIndexRedirect() {
  const { slug } = useParams();

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/${slug}/dashboard`} replace />;
}

function RootRoute() {
  const tenantSlug = getEmpresaSlug();

  if (tenantSlug) {
    return <Navigate to={buildTenantPath(tenantSlug, '/dashboard')} replace />;
  }

  return <LandingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/cadastro" element={<CadastroEmpresa />} />
      <Route path="/convites/:token" element={<AceitarConvite />} />
      <Route path="/admin" element={<AdminRoute><AdminShell><AdminLayout><Navigate to="/admin/dashboard" replace /></AdminLayout></AdminShell></AdminRoute>} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminShell><AdminLayout><AdminDashboard /></AdminLayout></AdminShell></AdminRoute>} />
      <Route path="/admin/empresas" element={<AdminRoute><AdminShell><AdminLayout><AdminEmpresas /></AdminLayout></AdminShell></AdminRoute>} />
      <Route path="/admin/logs" element={<AdminRoute><AdminShell><AdminLayout><AdminLogs /></AdminLayout></AdminShell></AdminRoute>} />
      <Route path="/admin/notificacoes" element={<AdminRoute><AdminShell><AdminLayout><AdminNotificacoes /></AdminLayout></AdminShell></AdminRoute>} />
      <Route path="/:slug" element={<TenantIndexRedirect />} />

      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/nova-operacao" element={<ProtectedRoute><AppLayout><NovaOperacao /></AppLayout></ProtectedRoute>} />
      <Route path="/editar-operacao/:id" element={<ProtectedRoute><AppLayout><NovaOperacao /></AppLayout></ProtectedRoute>} />
      <Route path="/lista-rotas" element={<ProtectedRoute><AppLayout><ListaRotas /></AppLayout></ProtectedRoute>} />
      <Route path="/:tenant/registro-execucao" element={<ProtectedRoute><AppLayout><RegistroExecucao /></AppLayout></ProtectedRoute>} />
      <Route path="/:tenant/relatorio-rentabilidade" element={<ProtectedRoute><AppLayout><RelatorioRentabilidade /></AppLayout></ProtectedRoute>} />
      <Route path="/custos-globais" element={<ProtectedRoute><AppLayout><CustosGlobais /></AppLayout></ProtectedRoute>} />
      <Route path="/bases" element={<ProtectedRoute><AppLayout><BasesConfig /></AppLayout></ProtectedRoute>} />
      <Route path="/equipe" element={<ProtectedRoute><AppLayout><Equipe /></AppLayout></ProtectedRoute>} />

      <Route path="/:slug/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/:slug/nova-operacao" element={<ProtectedRoute><AppLayout><NovaOperacao /></AppLayout></ProtectedRoute>} />
      <Route path="/:slug/editar-operacao/:id" element={<ProtectedRoute><AppLayout><NovaOperacao /></AppLayout></ProtectedRoute>} />
      <Route path="/:slug/lista-rotas" element={<ProtectedRoute><AppLayout><ListaRotas /></AppLayout></ProtectedRoute>} />
      <Route path="/:slug/custos-globais" element={<ProtectedRoute><AppLayout><CustosGlobais /></AppLayout></ProtectedRoute>} />
      <Route path="/:slug/bases" element={<ProtectedRoute><AppLayout><BasesConfig /></AppLayout></ProtectedRoute>} />
      <Route path="/:slug/equipe" element={<ProtectedRoute><AppLayout><Equipe /></AppLayout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
