import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../../components/Forms/Button';
import { listLogs, type LogAcessoAdmin } from '../../services/adminService';

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogAcessoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregar = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await listLogs(300);
      setLogs(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800/80 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Logs de acesso</h2>
          <p className="text-xs text-gray-500">Últimos eventos registrados por usuário e empresa.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => void carregar()}>
          Atualizar
        </Button>
      </div>

      {error && <div className="mx-5 mt-4 rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>}

      {loading ? (
        <p className="px-5 py-6 text-sm text-gray-400">Carregando logs...</p>
      ) : logs.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-400">Nenhum log disponível.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Ação</th>
                <th className="px-5 py-3">Empresa</th>
                <th className="px-5 py-3">Usuário</th>
                <th className="px-5 py-3">IP</th>
                <th className="px-5 py-3">User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-gray-300">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {format(new Date(log.criado_em), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-100">{log.acao}</td>
                  <td className="px-5 py-3">{log.empresa_nome ?? '-'}</td>
                  <td className="px-5 py-3">
                    <p>{log.usuario_nome ?? '-'}</p>
                    <p className="text-xs text-gray-500">{log.usuario_email ?? ''}</p>
                  </td>
                  <td className="px-5 py-3 text-xs">{log.ip ?? '-'}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{log.user_agent ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
