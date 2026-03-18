import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { useBases } from '../hooks/useBases';
import { useRotas } from '../hooks/useRotas';
import { getDistanceAndTime } from '../services/googleMapsService';
import { calcularCustoOperacional, calcularMargem, calcularValorVendaPorMargem } from '../services/calculosService';
import { AlertCircle, Truck, Users } from 'lucide-react';

const NovaOperacao: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { allBases, getBaseByCodigo } = useBases();
  const { getOperacaoById, addOperacao, updateOperacao } = useRotas();

  const [loading, setLoading] = useState(false);
  const [origem, setOrigem] = useState<any>(null);
  const [destino, setDestino] = useState<any>(null);
  const [distancia, setDistancia] = useState<number | null>(null);
  const [tempo, setTempo] = useState<string>('');
  const [erroRota, setErroRota] = useState('');

  // Form fields
  const [nomeOperacao, setNomeOperacao] = useState('');
  const [valorLitro, setValorLitro] = useState('');
  const [mediaVeiculo, setMediaVeiculo] = useState('2.8');
  const [custoMotorista, setCustoMotorista] = useState('');
  const [pedagio, setPedagio] = useState('');
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
    return litros * Number(valorLitro);
  }, [distancia, valorLitro, mediaVeiculo]);

  const litrosCalc = useMemo(() => {
    if (!distancia || !mediaVeiculo || Number(mediaVeiculo) === 0) return 0;
    return distancia / Number(mediaVeiculo);
  }, [distancia, mediaVeiculo]);

  // Carregar operação para edição
  useEffect(() => {
    if (id) {
      const operacao = getOperacaoById(id);
      if (operacao) {
        setNomeOperacao(operacao.nomeOperacao);
        setOrigem({ value: operacao.codigoOrigem, label: `${operacao.codigoOrigem} - ${operacao.enderecoOrigem || ''}` });
        setDestino({ value: operacao.codigoDestino, label: `${operacao.codigoDestino} - ${operacao.enderecoDestino || ''}` });
        setDistancia(operacao.distanciaKm);
        if (operacao.custoDieselLitroOriginal) setValorLitro(operacao.custoDieselLitroOriginal.toString());
        if (operacao.consumoKmL) setMediaVeiculo(operacao.consumoKmL.toString());
        setCustoMotorista(operacao.custoMotoristaOriginal?.toString() || '');
        setPedagio(operacao.pedagio.toString());
        setValorVenda(operacao.valorVenda.toString());
        setTipoVeiculo(operacao.tipoVeiculo || 'proprio');
        if (operacao.valorAgregado) setValorAgregado(operacao.valorAgregado.toString());
      }
    }
  }, [id]);

  // Recalcular quando valores mudam
  useEffect(() => {
    if (distancia) {
      const resultado = calcularCustoOperacional({
        distanciaKm: distancia,
        custoCombustivel: custoCombustivelCalc,
        custoMotorista: Number(custoMotorista) || 0,
        pedagio: Number(pedagio) || 0,
        tipoVeiculo,
        valorAgregado: Number(valorAgregado) || 0
      });

      setCustoTotal(resultado.custoTotal);
      setCustoPorKm(resultado.custoPorKm);

      const valorParaCalculo = Number(valorVenda) || Number(valorCliente) || 0;
      if (valorParaCalculo > 0) {
        const m = calcularMargem(resultado.custoTotal, valorParaCalculo);
        setLucro(m.lucro);
        setMargem(m.margemPercent);
      }
    }
  }, [distancia, custoCombustivelCalc, custoMotorista, pedagio, valorVenda, valorCliente, tipoVeiculo, valorAgregado]);

  // Calculadora reversa
  useEffect(() => {
    if (margemDesejada && custoTotal > 0) {
      const valorSugerido = calcularValorVendaPorMargem(custoTotal, Number(margemDesejada));
      setValorVenda(valorSugerido.toFixed(2));
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

  const handleSalvar = (status: 'rascunho' | 'aprovada') => {
    if (!origem || !destino || !distancia) return;

    const baseOrigem = getBaseByCodigo(origem.value);
    const baseDestino = getBaseByCodigo(destino.value);

    const existente = id ? getOperacaoById(id) : null;

    const operacao = {
      id: id || `op_${Date.now()}`,
      nomeOperacao,
      userId: 'user1',
      createdAt: existente?.createdAt || new Date().toISOString(),
      criadoPor: existente?.criadoPor || 'João Paulo',
      editadoPor: id ? 'João Paulo' : undefined,
      dataEdicao: id ? new Date().toISOString() : undefined,
      dataAprovacao: status === 'aprovada' ? new Date().toISOString() : undefined,
      codigoOrigem: origem.value,
      codigoDestino: destino.value,
      enderecoOrigem: baseOrigem?.endereco,
      enderecoDestino: baseDestino?.endereco,
      distanciaKm: distancia,
      tempoEstimado: tempo,
      tipoVeiculo,
      valorAgregado: tipoVeiculo === 'agregado' ? Number(valorAgregado) || 0 : undefined,
      custoDieselLitroOriginal: Number(valorLitro) || 0,
      consumoKmL: Number(mediaVeiculo) || 0,
      custoCombustivelOriginal: custoCombustivelCalc,
      custoMotoristaOriginal: Number(custoMotorista) || 0,
      pedagio: Number(pedagio) || 0,
      outrosCustos: 0,
      valorCliente: valorCliente ? Number(valorCliente) : undefined,
      valorVenda: Number(valorVenda),
      custoTotalOriginal: custoTotal,
      lucroOriginal: lucro,
      margemOriginalPercent: margem,
      status
    };

    if (id) {
      updateOperacao(operacao);
    } else {
      addOperacao(operacao);
    }

    navigate('/lista-rotas');
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
                <p className="text-2xl font-bold text-blue-400">{distancia.toFixed(1)} km</p>
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
        {tipoVeiculo === 'proprio' && (
          <div className="mb-4 p-4 bg-green-900/20 rounded-lg border border-green-800">
            <h3 className="font-medium text-green-400 mb-3">Custos (Veículo Próprio)</h3>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <Input
                label="Valor do Litro (R$)"
                type="number"
                step="0.01"
                value={valorLitro}
                onChange={(e) => setValorLitro(e.target.value)}
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
                type="number"
                step="0.01"
                value={custoMotorista}
                onChange={(e) => setCustoMotorista(e.target.value)}
                icon={<span className="text-gray-500">R$</span>}
              />
            </div>
            {distancia && Number(valorLitro) > 0 && Number(mediaVeiculo) > 0 && (
              <div className="p-3 bg-green-900/30 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-green-500">Litros necessários</p>
                    <p className="text-lg font-bold text-green-400">{litrosCalc.toFixed(1)} L</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-500">Custo Combustível</p>
                    <p className="text-lg font-bold text-green-400">R$ {custoCombustivelCalc.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-500">Custo/km</p>
                    <p className="text-lg font-bold text-green-400">R$ {(custoCombustivelCalc / distancia).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Campo de Agregado */}
        {tipoVeiculo === 'agregado' && (
          <div className="mb-4 p-4 bg-orange-900/20 rounded-lg border border-orange-800">
            <h3 className="font-medium text-orange-400 mb-3">Custo Agregado</h3>
            <Input
              label="Valor de Repasse ao Agregado (R$)"
              type="number"
              step="0.01"
              value={valorAgregado}
              onChange={(e) => setValorAgregado(e.target.value)}
              icon={<span className="text-gray-500">R$</span>}
            />
            {distancia && Number(valorAgregado) > 0 && (
              <p className="text-xs text-orange-400 mt-2">
                Equivale a R$ {(Number(valorAgregado) / distancia).toFixed(2)}/km
              </p>
            )}
          </div>
        )}

        {/* Pedágio e Valor do Cliente */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Input
            label="Pedágio (R$)"
            type="number"
            step="0.01"
            value={pedagio}
            onChange={(e) => setPedagio(e.target.value)}
            icon={<span className="text-gray-500">R$</span>}
          />

          <Input
            label="Valor do Cliente (opcional)"
            type="number"
            step="0.01"
            value={valorCliente}
            onChange={(e) => setValorCliente(e.target.value)}
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
                <p className="text-xl font-bold text-gray-100">R$ {custoTotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Custo por km</p>
                <p className="text-xl font-bold text-gray-100">R$ {custoPorKm.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Margem e Valor de Venda */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Input
            label="Valor da Rota (R$)"
            type="number"
            step="0.01"
            value={valorVenda}
            onChange={(e) => setValorVenda(e.target.value)}
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

        {(Number(valorVenda) > 0 || Number(valorCliente) > 0) && custoTotal > 0 && (
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="font-medium text-gray-300 mb-3">
              Lucro da Rota {valorVenda ? '' : '(baseado no Valor do Cliente)'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Lucro</p>
                <p className={`text-xl font-bold ${lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {lucro.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Margem</p>
                <p className={`text-xl font-bold ${margemColor}`}>
                  {margem.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/lista-rotas')}>
            Cancelar
          </Button>

          <Button variant="secondary" onClick={() => handleSalvar('rascunho')}>
            Salvar Rascunho
          </Button>

          <Button
            variant="success"
            onClick={() => handleSalvar('aprovada')}
            disabled={!valorVenda || !distancia}
          >
            Aprovar e Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NovaOperacao;
