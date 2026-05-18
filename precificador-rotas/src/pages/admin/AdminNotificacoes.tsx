import { useMemo, useState } from 'react';
import { Button } from '../../components/Forms/Button';
import { Input } from '../../components/Forms/Input';
import { criarNotificacao } from '../../services/adminService';

const tipos = ['info', 'success', 'warning', 'error'] as const;

type TipoNotificacao = (typeof tipos)[number];

export default function AdminNotificacoes() {
  const [empresaId, setEmpresaId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState<TipoNotificacao>('info');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => titulo.trim() && mensagem.trim() && (empresaId.trim() || usuarioId.trim()), [titulo, mensagem, empresaId, usuarioId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setError('Preencha título, mensagem e pelo menos Empresa ID ou Usuário ID.');
      return;
    }

    setSending(true);
    setError('');
    setFeedback('');

    try {
      const id = await criarNotificacao({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo,
        empresaId: empresaId.trim() || undefined,
        usuarioId: usuarioId.trim() || undefined,
        link: link.trim() || undefined
      });

      setFeedback(`Notificação criada com sucesso. ID: ${id}`);
      setTitulo('');
      setMensagem('');
      setLink('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro ao criar notificação.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-100">Enviar notificação</h2>
      <p className="mt-1 text-sm text-gray-400">Use esta tela para enviar avisos segmentados por empresa ou usuário.</p>

      {error && <div className="mt-4 rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>}
      {feedback && <div className="mt-4 rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-300">{feedback}</div>}

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Empresa ID (opcional)" value={empresaId} onChange={(event) => setEmpresaId(event.target.value)} placeholder="UUID da empresa" />
          <Input label="Usuário ID (opcional)" value={usuarioId} onChange={(event) => setUsuarioId(event.target.value)} placeholder="UUID de usuarios.id" />
        </div>

        <Input label="Título" value={titulo} onChange={(event) => setTitulo(event.target.value)} placeholder="Ex: Manutenção programada" />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Mensagem</label>
          <textarea
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-gray-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30"
            rows={5}
            value={mensagem}
            onChange={(event) => setMensagem(event.target.value)}
            placeholder="Digite o conteúdo da notificação"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Tipo</label>
            <select
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-gray-100 outline-none focus:border-blue-500"
              value={tipo}
              onChange={(event) => setTipo(event.target.value as TipoNotificacao)}
            >
              {tipos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <Input label="Link (opcional)" value={link} onChange={(event) => setLink(event.target.value)} placeholder="/alguma-rota" />
        </div>

        <Button type="submit" loading={sending} disabled={!canSubmit}>
          Enviar notificação
        </Button>
      </form>
    </section>
  );
}
