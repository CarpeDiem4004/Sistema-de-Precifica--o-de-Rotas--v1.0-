import React, { useState } from 'react';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { useCustosGlobais } from '../hooks/useCustosGlobais';
import { useAuth } from '../contexts/AuthContext';
import { formatarDataHora, formatarMoedaInputBR, formatarMoedaParaCampo, parseMoedaInputBR } from '../utils/formatadores';
import { Save, RefreshCw } from 'lucide-react';

const CustosGlobais: React.FC = () => {
  const { canEdit, isSuspended } = useAuth();
  const { custos, loading, error, atualizarCustos } = useCustosGlobais();
  
  const [diesel, setDiesel] = useState(formatarMoedaParaCampo(custos.precoDieselLitro));
  const [motorista, setMotorista] = useState(formatarMoedaParaCampo(custos.custoMotoristaKm));
  const [pedagio, setPedagio] = useState(formatarMoedaParaCampo(custos.pedagioMedioKm));
  const [salvo, setSalvo] = useState(false);

  React.useEffect(() => {
    setDiesel(formatarMoedaParaCampo(custos.precoDieselLitro));
    setMotorista(formatarMoedaParaCampo(custos.custoMotoristaKm));
    setPedagio(formatarMoedaParaCampo(custos.pedagioMedioKm));
  }, [custos]);

  const handleSalvar = async () => {
    await atualizarCustos({
      precoDieselLitro: parseMoedaInputBR(diesel),
      custoMotoristaKm: parseMoedaInputBR(motorista),
      pedagioMedioKm: parseMoedaInputBR(pedagio)
    });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Custos Globais</h1>

      <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-400 mb-6">
          Estes valores são usados como referência para cálculos de custo operacional. 
          Ao alterar, as margens atuais de todas as rotas aprovadas serão recalculadas automaticamente.
        </p>

        {isSuspended && (
          <div className="mb-6 rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
            Empresa suspensa: os custos continuam visíveis, mas alterações estão temporariamente desativadas.
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Preço do Diesel (R$/litro)"
            type="text"
            inputMode="numeric"
            value={diesel}
            onChange={(e) => setDiesel(formatarMoedaInputBR(e.target.value))}
            icon={<span className="text-gray-500">R$</span>}
            disabled={!canEdit}
          />

          <Input
            label="Custo do Motorista (R$/km)"
            type="text"
            inputMode="numeric"
            value={motorista}
            onChange={(e) => setMotorista(formatarMoedaInputBR(e.target.value))}
            icon={<span className="text-gray-500">R$</span>}
            disabled={!canEdit}
          />

          <Input
            label="Pedágio Médio (R$/km)"
            type="text"
            inputMode="numeric"
            value={pedagio}
            onChange={(e) => setPedagio(formatarMoedaInputBR(e.target.value))}
            icon={<span className="text-gray-500">R$</span>}
            disabled={!canEdit}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Última atualização: {formatarDataHora(custos.dataAtualizacao)}
          </p>
          
          <Button onClick={handleSalvar} disabled={!canEdit}>
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Alterações
            </div>
          </Button>
        </div>

        {salvo && (
          <div className="mt-4 p-3 bg-green-900/30 text-green-400 rounded-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {loading ? 'Carregando custos...' : 'Custos atualizados com sucesso! As margens serão recalculadas.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustosGlobais;
