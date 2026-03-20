import React, { useState } from 'react';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { useCustosGlobais } from '../hooks/useCustosGlobais';
import { formatarDataHora } from '../utils/formatadores';
import { Save, RefreshCw } from 'lucide-react';

const CustosGlobais: React.FC = () => {
  const { custos, loading, error, atualizarCustos } = useCustosGlobais();
  
  const [diesel, setDiesel] = useState(custos.precoDieselLitro.toString());
  const [motorista, setMotorista] = useState(custos.custoMotoristaKm.toString());
  const [pedagio, setPedagio] = useState(custos.pedagioMedioKm.toString());
  const [salvo, setSalvo] = useState(false);

  React.useEffect(() => {
    setDiesel(custos.precoDieselLitro.toString());
    setMotorista(custos.custoMotoristaKm.toString());
    setPedagio(custos.pedagioMedioKm.toString());
  }, [custos]);

  const handleSalvar = async () => {
    await atualizarCustos({
      precoDieselLitro: Number(diesel),
      custoMotoristaKm: Number(motorista),
      pedagioMedioKm: Number(pedagio)
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

        <div className="space-y-4">
          <Input
            label="Preço do Diesel (R$/litro)"
            type="number"
            step="0.01"
            value={diesel}
            onChange={(e) => setDiesel(e.target.value)}
            icon={<span className="text-gray-500">R$</span>}
          />

          <Input
            label="Custo do Motorista (R$/km)"
            type="number"
            step="0.01"
            value={motorista}
            onChange={(e) => setMotorista(e.target.value)}
            icon={<span className="text-gray-500">R$</span>}
          />

          <Input
            label="Pedágio Médio (R$/km)"
            type="number"
            step="0.01"
            value={pedagio}
            onChange={(e) => setPedagio(e.target.value)}
            icon={<span className="text-gray-500">R$</span>}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Última atualização: {formatarDataHora(custos.dataAtualizacao)}
          </p>
          
          <Button onClick={handleSalvar}>
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
