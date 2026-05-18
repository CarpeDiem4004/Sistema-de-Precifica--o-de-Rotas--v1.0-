import React, { useState } from 'react';

const RegistroExecucao: React.FC = () => {
    const [selectedOperacao, setSelectedOperacao] = useState<string>('');

    return (
        <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-10">Registrar Execução</h1>

                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
                    <div className="mb-6">
                        <label className="block text-sm text-slate-400 mb-2">Operação</label>
                        <select
                            value={selectedOperacao}
                            onChange={(e) => setSelectedOperacao(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Selecione uma operação</option>
                            <option value="rota-sp-rj">Rota São Paulo → Rio de Janeiro</option>
                            <option value="rota-bh-vitoria">Rota Belo Horizonte → Vitória</option>
                            <option value="rota-poa-curitiba">Rota Porto Alegre → Curitiba</option>
                        </select>
                    </div>

                    <p className="text-center text-slate-500 text-sm mt-8">
                        Esta é uma versão mínima para teste.<br />
                        Se você está vendo esta tela, o erro de sintaxe foi resolvido.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegistroExecucao;
