import React from 'react';
export default function SettingsTab() {
  return (
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
      <h3 className="font-medium text-slate-800 mb-4 text-center">Configurações & Backup</h3>
      <p className="text-sm text-slate-500 text-center mb-6">Módulo de Exportação em breve.</p>
      <button className="w-full bg-md-secondary text-white py-3 rounded-full mb-3 hover:bg-opacity-90 transition">
        Exportar Dados (JSON)
      </button>
      <button className="w-full bg-slate-100 text-slate-700 py-3 rounded-full hover:bg-slate-200 transition">
        Importar Dados
      </button>
    </div>
  );
}
