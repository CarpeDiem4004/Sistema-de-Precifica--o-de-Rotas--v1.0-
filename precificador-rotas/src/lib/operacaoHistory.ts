import type { HistoricoAlteracaoCampo, HistoricoAlteracaoOperacao, Operacao } from '../types';
import { formatarMoeda, formatarNumero, formatarQuilometragem } from '../utils/formatadores';

function formatarTipoVeiculo(valor: Operacao['tipoVeiculo']) {
  return valor === 'proprio' ? 'Frota própria' : 'Terceiro';
}

function formatarStatusRota(ativo: boolean | undefined) {
  return ativo === false ? 'Desativada' : 'Ativa';
}

function diffNumerico(campo: string, antes: number | undefined, depois: number | undefined, formatador: (valor: number) => string): HistoricoAlteracaoCampo | null {
  const valorAntes = antes ?? 0;
  const valorDepois = depois ?? 0;

  if (valorAntes === valorDepois) {
    return null;
  }

  return {
    campo,
    antes: formatador(valorAntes),
    depois: formatador(valorDepois),
    direcao: valorDepois > valorAntes ? 'aumentou' : 'diminuiu'
  };
}

function diffTexto(campo: string, antes: string | undefined, depois: string | undefined): HistoricoAlteracaoCampo | null {
  const valorAntes = (antes ?? '').trim();
  const valorDepois = (depois ?? '').trim();

  if (valorAntes === valorDepois) {
    return null;
  }

  return {
    campo,
    antes: valorAntes || 'Nao informado',
    depois: valorDepois || 'Nao informado',
    direcao: 'alterado'
  };
}

export function criarHistoricoOperacaoNova(operacao: Operacao, usuario: string): HistoricoAlteracaoOperacao {
  const alteracoes: HistoricoAlteracaoCampo[] = [
    {
      campo: 'Nome da operação',
      antes: 'N/A',
      depois: operacao.nomeOperacao,
      direcao: 'alterado'
    },
    {
      campo: 'Origem',
      antes: 'N/A',
      depois: operacao.codigoOrigem,
      direcao: 'alterado'
    },
    {
      campo: 'Destino',
      antes: 'N/A',
      depois: operacao.codigoDestino,
      direcao: 'alterado'
    },
    {
      campo: 'Tipo de operação',
      antes: 'N/A',
      depois: formatarTipoVeiculo(operacao.tipoVeiculo),
      direcao: 'alterado'
    },
    {
      campo: 'Status',
      antes: 'N/A',
      depois: operacao.status === 'aprovada' ? 'Aprovada' : 'Rascunho',
      direcao: 'alterado'
    }
  ];

  return {
    data: operacao.createdAt || new Date().toISOString(),
    usuario,
    alteracoes
  };
}

export function criarHistoricoAlteracaoOperacao(anterior: Operacao, atual: Operacao, usuario: string): HistoricoAlteracaoOperacao | null {
  const alteracoes = [
    diffTexto('Nome da operação', anterior.nomeOperacao, atual.nomeOperacao),
    diffTexto('Status da rota', formatarStatusRota(anterior.ativo), formatarStatusRota(atual.ativo)),
    diffTexto('Origem', anterior.codigoOrigem, atual.codigoOrigem),
    diffTexto('Destino', anterior.codigoDestino, atual.codigoDestino),
    diffTexto('Tipo de operação', formatarTipoVeiculo(anterior.tipoVeiculo), formatarTipoVeiculo(atual.tipoVeiculo)),
    diffNumerico('Distância', anterior.distanciaKm, atual.distanciaKm, (valor) => formatarQuilometragem(valor, 2)),
    diffNumerico('Valor do litro', anterior.custoDieselLitroOriginal, atual.custoDieselLitroOriginal, formatarMoeda),
    diffNumerico('Custo motorista', anterior.custoMotoristaOriginal, atual.custoMotoristaOriginal, formatarMoeda),
    diffNumerico('Pedágio', anterior.pedagio, atual.pedagio, formatarMoeda),
    diffNumerico('Valor cliente', anterior.valorCliente, atual.valorCliente, formatarMoeda),
    diffNumerico('Valor venda', anterior.valorVenda, atual.valorVenda, formatarMoeda),
    diffNumerico('Repasse terceiro', anterior.valorAgregado, atual.valorAgregado, formatarMoeda),
    diffNumerico('Média km/l', anterior.consumoKmL, atual.consumoKmL, (valor) => formatarNumero(valor, 1))
  ].filter((item): item is HistoricoAlteracaoCampo => Boolean(item));

  if (alteracoes.length === 0) {
    return null;
  }

  return {
    data: new Date().toISOString(),
    usuario,
    alteracoes
  };
}