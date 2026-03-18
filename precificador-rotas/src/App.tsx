import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { WorldMapBackground } from './components/WorldMapBackground';
import Dashboard from './pages/Dashboard';
import NovaOperacao from './pages/NovaOperacao';
import ListaRotas from './pages/ListaRotas';
import CustosGlobais from './pages/CustosGlobais';
import BasesConfig from './pages/BasesConfig';
import { initializeStorage } from './services/storageService';

function App() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-900">
        <WorldMapBackground />
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 main-content min-h-screen">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/nova-operacao" element={<NovaOperacao />} />
              <Route path="/editar-operacao/:id" element={<NovaOperacao />} />
              <Route path="/lista-rotas" element={<ListaRotas />} />
              <Route path="/custos-globais" element={<CustosGlobais />} />
              <Route path="/bases" element={<BasesConfig />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
