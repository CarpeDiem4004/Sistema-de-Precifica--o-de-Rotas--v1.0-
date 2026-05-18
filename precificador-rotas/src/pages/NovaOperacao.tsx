import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { useBases } from '../hooks/useBases';
import { useRotas } from '../hooks/useRotas';
import { useAuth } from '../contexts/AuthContext';
import { useTenantPath } from '../hooks/useTenantPath';
import { criarHistoricoAlteracaoOperacao, criarHistoricoOperacaoNova } from '../lib/operacaoHistory';
import { getDistanceAndTime } from '../services/googleMapsService';
import { calcularCustoOperacional, calcularMargem, calcularValorVendaPorMargem } from '../services/calculosService';
import { AlertCircle, Truck, Users } from 'lucide-react';
import { formatarMoeda, formatarMoedaInputBR, formatarMoedaParaCampo, formatarPercentual, formatarQuilometragem, parseMoedaInputBR } from '../utils/formatadores';

type BaseOption = {
  value: string;
  label: string;
};

const NovaOperacao: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tenantPath = useTenantPath();
  const { user, perfil, canEdit, isSuspended } = useAuth();
  const { allBases, loading: basesLoading, error: basesError, getBaseByCodigo } = useBases();
  const { allOperacoes, loading: operacoesLoading, error: operacoesError, getOperacaoById, addOperacao, updateOperacao } = useRotas();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [origem, setOrigem] = useState<BaseOption | null>(null);
  const [destino, setDestino] = useState<BaseOption | null>(null);
  const [distancia, setDistancia] = useState<number | null>(null);
  const [tempo, setTempo] = useState<string>('');
  const [erroRota, setErroRota] = useState('');

  // Form fields
  const [nomeOperacao, setNomeOperacao] = useState('');
  const [valorLitro, setValorLitro] = useState('');
  const [mediaVeiculo, setMediaVeiculo] = useState('2.8');
  const [custoMotorista, setCustoMotorista] = useState('');
  const [pedagioProprio, setPedagioProprio] = useState('');
  const [pedagioAgregado, setPedagioAgregado] = useState('');
  const [incluirPedagioNoAgregado, setIncluirPedagioNoAgregado] = useState(true);
  const [valorCliente, setValorCliente] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [margemDesejada, setMargemDesejada] = useState('');

  // Tipo de veículo
  const [tipoVeiculo, setTipoVeiculo] = useState<'proprio' | 'agregado'>('proprio');
  const [valorAgregado, setValorAgregado] = useState('');

  // Results
  const [custoTotal, setCustoTotal] = useState(0);
  const [custoPorKm, setCustoPorKm] = useState(0);
  const [lucro, setLucro] = useState(0);
  const [margem, setMargem] = useState(0);

  // Cálculo automático do combustível
  const custoCombustivelCalc = useMemo(() => {
    if (!distancia || !valorLitro || !mediaVeiculo || Number(mediaVeiculo) === 0) return 0;
    const litros = distancia / Number(mediaVeiculo);
    return litros * parseMoedaInputBR(valorLitro);
  }, [distancia, valorLitro, mediaVeiculo]);

  const valorAgregadoNumerico = useMemo(() => parseMoedaInputBR(valorAgregado), [valorAgregado]);
  const pedagioProprioNumerico = useMemo(() => parseMoedaInputBR(pedagioProprio), [pedagioProprio]);
  const pedagioAgregadoNumerico = useMemo(() => parseMoedaInputBR(pedagioAgregado), [pedagioAgregado]);
  const pedagioAplicado = useMemo(() => {
    if (tipoVeiculo === 'proprio') {
      return pedagioProprioNumerico;
    }

    return incluirPedagioNoAgregado ? pedagioAgregadoNumerico : 0;
  }, [tipoVeiculo, incluirPedagioNoAgregado, pedagioProprioNumerico, pedagioAgregadoNumerico]);

  const litrosCalc = useMemo(() => {
    if (!distancia || !mediaVeiculo || Number(mediaVeiculo) === 0) return 0;
    return distancia / Number(mediaVeiculo);
  }, [distancia, mediaVeiculo]);

  // Carregar operação para edição
  useEffect(() => {
    if (id) {
      const operacao = allOperacoes.find((item) => item.id === id);
      if (operacao) {
        setNomeOperacao(operacao.nomeOperacao);
        setOrigem({ value: operacao.codigoOrigem, label: `${operacao.codigoOrigem} - ${operacao.enderecoOrigem || ''}` });
        setDestino({ value: operacao.codigoDestino, label: `${operacao.codigoDestino} - ${operacao.enderecoDestino || ''}` });
        setDistancia(operacao.distanciaKm);
        if (operacao.custoDieselLitroOriginal) setValorLitro(formatarMoedaParaCampo(operacao.custoDieselLitroOriginal));
        if (operacao.consumoKmL) setMediaVeiculo(operacao.consumoKmL.toString());
        setCustoMotorista(formatarMoedaParaCampo(operacao.custoMotoristaOriginal || 0));
        if (operacao.tipoVeiculo === 'proprio') {
          setPedagioProprio(formatarMoedaParaCampo(operacao.pedagio || 0));
          setPedagioAgregado('');
          setIncluirPedagioNoAgregado(false);
        } else {
          setPedagioAgregado(formatarMoedaParaCampo(operacao.pedagio || 0));
          setPedagioProprio('');
          setIncluirPedagioNoAgregado((operacao.pedagio || 0) > 0);
        }
        setValorVenda(formatarMoedaParaCampo(operacao.valorVenda || 0));
        setTipoVeiculo(operacao.tipoVeiculo || 'proprio');
        if (operacao.valorAgregado) setValorAgregado(formatarMoedaParaCampo(operacao.valorAgregado));
      }
    }
  }, [id, allOperacoes]);

  // Recalcular quando valores mudam
  useEffect(() => {
    if (distancia) {
      const resultado = calcularCustoOperacional({
        distanciaKm: distancia,
        custoCombustivel: custoCombustivelCalc,
        custoMotorista: parseMoedaInputBR(custoMotorista),
        pedagio: pedagioAplicado,
        tipoVeiculo,
        valorAgregado: parseMoedaInputBR(valorAgregado)
      });

      setCustoTotal(resultado.custoTotal);
      setCustoPorKm(resultado.custoPorKm);

      const valorParaCalculo = parseMoedaInputBR(valorVenda) || parseMoedaInputBR(valorCliente) || 0;
      if (valorParaCalculo > 0) {
        const m = calcularMargem(resultado.custoTotal, valorParaCalculo);
        setLucro(m.lucro);
        setMargem(m.margemPercent);
      }
    }
  }, [distancia, custoCombustivelCalc, custoMotorista, pedagioAplicado, valorVenda, valorCliente, tipoVeiculo, valorAgregado]);

  // Calculadora reversa
  useEffect(() => {
    if (margemDesejada && custoTotal > 0) {
      const valorSugerido = calcularValorVendaPorMargem(custoTotal, Number(margemDesejada));
      setValorVenda(formatarMoedaParaCampo(valorSugerido));
    }
  }, [margemDesejada, custoTotal]);

  const buscarRota = async () => {
    if (!origem || !destino) return;

    setLoading(true);
    setErroRota('');

    try {
      const baseOrigem = getBaseByCodigo(origem.value);
      const baseDestino = getBaseByCodigo(destino.value);

      if (!baseOrigem || !baseDestino) {
        setErroRota('Base não encontrada');
        return;
      }

      const result = await getDistanceAndTime(baseOrigem.endereco, baseDestino.endereco);
      setDistancia(result.distancia);
      setTempo(result.duracao);
    } catch {
      setErroRota('Erro ao calcular distância. Verifique os endereços.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (status: 'rascunho' | 'aprovada') => {
    if (!canEdit) {
      setErroRota('Empresa suspensa. Não é possível salvar ou aprovar operações.');
      return;
    }

    if (!origem || !destino || !distancia) return;

    setSaving(true);

    const baseOrigem = getBaseByCodigo(origem.value);
    const baseDestino = getBaseByCodigo(destino.value);

    const existente = id ? getOperacaoById(id) : null;

    const operacao = {
      id: id || `op_${Date.now()}`,
      nomeOperacao,
      ativo: existente?.ativo ?? true,
      userId: user?.id || perfil?.id || 'user_local',
      createdAt: existente?.createdAt || new Date().toISOString(),
      criadoPor: existente?.criadoPor || perfil?.nome || user?.email || 'Usuário',
      editadoPor: id ? (perfil?.nome || user?.email || 'Usuário') : undefined,
      dataEdicao: id ? new Date().toISOString() : undefined,
      dataAprovacao: status === 'aprovada' ? new Date().toISOString() : undefined,
      codigoOrigem: origem.value,
      codigoDestino: destino.value,
      enderecoOrigem: baseOrigem?.endereco,
      enderecoDestino: baseDestino?.endereco,
      distanciaKm: distancia,
      tempoEstimado: tempo,
      tipoVeiculo,
      valorAgregado: valorAgregadoNumerico || undefined,
      custoDieselLitroOriginal: parseMoedaInputBR(valorLitro),
      consumoKmL: Number(mediaVeiculo) || 0,
      custoCombustivelOriginal: custoCombustivelCalc,
      custoMotoristaOriginal: parseMoedaInputBR(custoMotorista),
      pedagio: pedagioAplicado,
      outrosCustos: 0,
      valorCliente: valorCliente ? parseMoedaInputBR(valorCliente) : undefined,
      valorVenda: parseMoedaInputBR(valorVenda),
      custoTotalOriginal: custoTotal,
      lucroOriginal: lucro,
      margemOriginalPercent: margem,
      status
    };

    const historicoNovaEdicao = existente
      ? criarHistoricoAlteracaoOperacao(existente, operacao, perfil?.nome || user?.email || 'Usuário')
      : null;

    const historicoNovaOperacao = !existente
      ? criarHistoricoOperacaoNova(operacao, perfil?.nome || user?.email || 'Usuário')
      : null;

    const operacaoComHistorico = {
      ...operacao,
      historicoAlteracoes: historicoNovaEdicao
        ? [historicoNovaEdicao, ...(existente?.historicoAlteracoes ?? [])]
        : historicoNovaOperacao
          ? [historicoNovaOperacao]
          : existente?.historicoAlteracoes ?? []
    };

    if (id) {
      await updateOperacao(operacaoComHistorico);
    } else {
      await addOperacao(operacaoComHistorico);
    }

    setSaving(false);
    navigate(tenantPath('/lista-rotas'));
  };

  const options = allBases.map(base => ({
    value: base.codigo,
    label: `${base.codigo} - ${base.nome}`
  }));

  const margemColor = margem < 0 ? 'text-red-400' : margem < 8 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">
        {id ? 'Editar Operação' : 'Nova Operação'}
      </h1>

      <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 p-6">
        {(basesError || operacoesError) && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {basesError || operacoesError}
          </div>
        )}

        {isSuspended && (
          <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
            Empresa suspensa: esta tela está em modo consulta. Alterações e novas operações estão bloqueadas.
          </div>
        )}

        <fieldset disabled={!canEdit} className={!canEdit ? 'opacity-80' : ''}>

        {/* Nome da Operação */}
        <div className="mb-6">
          <Input
            label="Nome da Operação"
            value={nomeOperacao}
            onChange={(e) => setNomeOperacao(e.target.value)}
            placeholder="Ex: SP-RJ - Cliente ABC - Março/2026"
          />
        </div>

        {/* Origem e Destino */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Código Origem
            </label>
            <Select
              options={options}
              value={origem}
              onChange={setOrigem}
              placeholder="Selecione a origem"
              className="react-select"
              isLoading={basesLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Código Destino
            </label>
            <Select
              options={options}
              value={destino}
              onChange={setDestino}
              placeholder="Selecione o destino"
              className="react-select"
              isLoading={basesLoading}
            />
          </div>
        </div>

        <Button
          onClick={buscarRota}
          disabled={!origem || !destino || loading}
          loading={loading}
          className="mb-6"
        >
          Calcular Distância
        </Button>

        {erroRota && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {erroRota}
          </div>
        )}

        {distancia && (
          <div className="mb-6 p-4 bg-blue-900/30 rounded-lg border border-blue-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Distância</p>
                <p className="text-2xl font-bold text-blue-400">{formatarQuilometragem(distancia, 2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Tempo Estimado</p>
                <p className="text-2xl font-bold text-blue-400">{tempo}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tipo de Veículo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Veículo</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoVeiculo('proprio')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                tipoVeiculo === 'proprio'
                  ? 'border-blue-500 bg-blue-900/30 text-blue-400'
                  : 'border-slate-600 bg-slate-700 text-gray-400 hover:border-slate-500'
              }`}
            >
              <Truck className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Veículo Próprio</p>
                <p className="text-xs opacity-75">Combustível + Motorista</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTipoVeiculo('agregado')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                tipoVeiculo === 'agregado'
                  ? 'border-orange-500 bg-orange-900/30 text-orange-400'
                  : 'border-slate-600 bg-slate-700 text-gray-400 hover:border-slate-500'
              }`}
            >
              <Users className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Veículo Agregado</p>
                <p className="text-xs opacity-75">Valor de repasse ao agregado</p>
              </div>
            </button>
          </div>
        </div>

        {/* Custos Veículo Próprio */}
        <div className={`mb-4 rounded-lg border p-4 transition-all ${
          tipoVeiculo === 'proprio'
            ? 'border-green-700 bg-green-900/20'
            : 'border-slate-700 bg-slate-900/30 opacity-75'
        }`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-medium text-green-400">Custos (Veículo Próprio)</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${
              tipoVeiculo === 'proprio'
                ? 'bg-green-950/80 text-green-300'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {tipoVeiculo === 'proprio' ? 'Usado no cálculo' : 'Somente referência'}
            </span>
          </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <Input
                label="Valor do Litro (R$)"
                type="text"
                inputMode="numeric"
                value={valorLitro}
                onChange={(e) => setValorLitro(formatarMoedaInputBR(e.target.value))}
                icon={<span className="text-gray-500">R$</span>}
              />
              <Input
                label="Média do Veículo (km/l)"
                type="number"
                step="0.1"
                value={mediaVeiculo}
                onChange={(e) => setMediaVeiculo(e.target.value)}
              />
              <Input
                label="Custo com Motorista (R$)"
                type="text"
                inputMode="numeric"
                value={custoMotorista}
                onChange={(e) => setCustoMotorista(formatarMoedaInputBR(e.target.value))}
                icon={<span className="text-gray-500">R$</span>}
              />
            </div>
            <div className="mb-3 max-w-sm">
              <Input
                label="Pedágio (R$)"
                type="text"
                inputMode="numeric"
                value={pedagioProprio}
                onChange={(e) => setPedagioProprio(formatarMoedaInputBR(e.target.value))}
                icon={<span className="text-gray-500">R$</span>}
              />
            </div>
            {distancia && parseMoedaInputBR(valorLitro) > 0 && Number(mediaVeiculo) > 0 && (
              <div className="p-3 bg-green-900/30 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-green-500">Litros necessários</p>
                    <p className="text-lg font-bold text-green-400">{litrosCalc.toFixed(1)} L</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-500">Custo Combustível</p>
                    <p className="text-lg font-bold text-green-400">{formatarMoeda(custoCombustivelCalc)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-500">Custo/km</p>
                    <p className="text-lg font-bold text-green-400">{formatarMoeda(custoCombustivelCalc / distancia)}</p>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Campo de Agregado */}
        <div className={`mb-4 rounded-lg border p-4 transition-all ${
          tipoVeiculo === 'agregado'
            ? 'border-orange-700 bg-orange-900/20'
            : 'border-slate-700 bg-slate-900/30 opacity-75'
        }`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-medium text-orange-400">Custo Agregado</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${
              tipoVeiculo === 'agregado'
                ? 'bg-orange-950/80 text-orange-300'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {tipoVeiculo === 'agregado' ? 'Usado no cálculo' : 'Somente referência'}
            </span>
          </div>
            <Input
              label="Valor de Repasse ao Agregado (R$)"
              type="text"
              inputMode="numeric"
              value={valorAgregado}
              onChange={(e) => setValorAgregado(formatarMoedaInputBR(e.target.value))}
              icon={<span className="text-gray-500">R$</span>}
            />
            <div className="mt-4">
              <p className="mb-2 text-sm text-orange-300">A empresa também paga pedágio no agregado?</p>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setIncluirPedagioNoAgregado(true)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    incluirPedagioNoAgregado
                      ? 'border-orange-500 bg-orange-900/40 text-orange-200'
                      : 'border-slate-600 bg-slate-800 text-slate-300'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setIncluirPedagioNoAgregado(false)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    !incluirPedagioNoAgregado
                      ? 'border-orange-500 bg-orange-900/40 text-orange-200'
                      : 'border-slate-600 bg-slate-800 text-slate-300'
                  }`}
                >
                  Não
                </button>
              </div>

              {incluirPedagioNoAgregado && (
                <div className="max-w-sm">
                  <Input
                    label="Pedágio no Agregado (R$)"
                    type="text"
                    inputMode="numeric"
                    value={pedagioAgregado}
                    onChange={(e) => setPedagioAgregado(formatarMoedaInputBR(e.target.value))}
                    icon={<span className="text-gray-500">R$</span>}
                  />
                </div>
              )}
            </div>
            {distancia && valorAgregadoNumerico > 0 && (
              <p className="text-xs text-orange-400 mt-2">
                Equivale a {formatarMoeda(valorAgregadoNumerico / distancia)}/km
              </p>
            )}
        </div>

        {/* Valor do Cliente */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <Input
            label="Valor do Cliente (opcional)"
            type="text"
            inputMode="numeric"
            value={valorCliente}
            onChange={(e) => setValorCliente(formatarMoedaInputBR(e.target.value))}
            icon={<span className="text-gray-500">R$</span>}
          />
        </div>

        {/* Resultados */}
        {custoTotal > 0 && (
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="font-medium text-gray-300 mb-3">
              Resumo de Custos ({tipoVeiculo === 'proprio' ? 'Veículo Próprio' : 'Agregado'})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Custo Total</p>
                <p className="text-xl font-bold text-gray-100">{formatarMoeda(custoTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Custo por km</p>
                <p className="text-xl font-bold text-gray-100">{formatarMoeda(custoPorKm)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Margem e Valor de Venda */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Input
            label="Valor da Rota (R$)"
            type="text"
            inputMode="numeric"
            value={valorVenda}
            onChange={(e) => setValorVenda(formatarMoedaInputBR(e.target.value))}
            icon={<span className="text-gray-500">R$</span>}
          />

          <Input
            label="Margem Desejada (%)"
            type="number"
            step="0.1"
            value={margemDesejada}
            onChange={(e) => setMargemDesejada(e.target.value)}
            icon={<span className="text-gray-500">%</span>}
          />
        </div>

        {(parseMoedaInputBR(valorVenda) > 0 || parseMoedaInputBR(valorCliente) > 0) && custoTotal > 0 && (
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="font-medium text-gray-300 mb-3">
              Lucro da Rota {valorVenda ? '' : '(baseado no Valor do Cliente)'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Lucro</p>
                <p className={`text-xl font-bold ${lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatarMoeda(lucro)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Margem</p>
                <p className={`text-xl font-bold ${margemColor}`}>
                  {formatarPercentual(margem)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(tenantPath('/lista-rotas'))}>
            Cancelar
          </Button>

          <Button variant="secondary" onClick={() => void handleSalvar('rascunho')} disabled={saving || basesLoading || operacoesLoading || !canEdit}>
            Salvar Rascunho
          </Button>

          <Button
            variant="success"
            onClick={() => void handleSalvar('aprovada')}
            disabled={parseMoedaInputBR(valorVenda) <= 0 || !distancia || saving || basesLoading || operacoesLoading || !canEdit}
          >
            {saving ? 'Salvando...' : 'Aprovar e Salvar'}
          </Button>
        </div>
        </fieldset>
      </div>
    </div>
  );
};

export default NovaOperacao;
