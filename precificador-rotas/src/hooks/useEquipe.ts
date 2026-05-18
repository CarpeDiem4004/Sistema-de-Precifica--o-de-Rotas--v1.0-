import { useCallback, useEffect, useState } from 'react';
import { createConvite, getConvitesEmpresa, getUsuariosEmpresa, revokeConvite, type ConviteEmpresa, type UsuarioEmpresa } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro ao carregar equipe';
}

export function useEquipe() {
  const { empresa, isAdmin, loading: authLoading, canEdit } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [convites, setConvites] = useState<ConviteEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!empresa || !isAdmin) {
      setUsuarios([]);
      setConvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [usuariosData, convitesData] = await Promise.all([
        getUsuariosEmpresa(),
        getConvitesEmpresa()
      ]);
      setUsuarios(usuariosData);
      setConvites(convitesData);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [empresa, isAdmin]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refresh();
  }, [authLoading, refresh]);

  const convidar = async (email: string, cargo: ConviteEmpresa['cargo'], redirectBase?: string) => {
    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido enviar convites.');
    }

    const invite = await createConvite(email, cargo, redirectBase);
    await refresh();
    return invite;
  };

  const revogar = async (inviteId: string) => {
    if (!canEdit) {
      throw new Error('Empresa suspensa. Não é permitido revogar convites.');
    }

    await revokeConvite(inviteId);
    await refresh();
  };

  return {
    usuarios,
    convites,
    loading,
    error,
    isAdmin,
    convidar,
    revogar,
    refresh
  };
}
