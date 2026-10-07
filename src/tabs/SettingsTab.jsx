import React, { useState, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ScanBarcode } from 'lucide-react';
import { db } from '../db';
import { createNewFood, deleteFood, updateFood, createSavedMeal, deleteSavedMeal, updateSavedMeal, resetDiary, resetCatalog, restoreDefaultFoods, getFoodByBarcode } from '../services/crud';
import { fetchFoodByBarcode } from '../services/api';
import { exportData, importData } from '../services/backup';
import { fmt, getMealMacros } from '../utils/formatUtils';
import ClearableInput from '../components/ClearableInput';
import SwipeNumberInput from '../components/SwipeNumberInput';
import BarcodeScanner from '../components/BarcodeScanner';

const MySwal = withReactContent(Swal);

export default function SettingsTab() {
  const [view, setView] = useState('menu');
  const settings = useLiveQuery(() => db.settings.get(1));
  const foods = useLiveQuery(() => db.foods.toArray()) || [];
  const meals = useLiveQuery(() => db.meals.toArray()) || [];
  
  const fileInputRef = useRef(null);
  const handleImport = async (mode) => {
     const file = fileInputRef.current.files[0]; if(!file) return; const reader = new FileReader();
     reader.onload = async (e) => {
         const res = await importData(e.target.result, mode);
         if(res.success) { MySwal.fire('Importação concluída com sucesso!', '', 'success'); setView('menu'); }
         else MySwal.fire('Erro na importação', res.error, 'error');
     };
     reader.readAsText(file);
  };

  const renderMenu = () => (
    <div className="space-y-4">
      <button onClick={() => setView('goals')} className="w-full bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition"><h3 className="font-semibold text-slate-800 text-lg">🎯 Metas Nutricionais</h3><p className="text-sm text-slate-500 mt-1">Definir objetivos diários e por dia da semana.</p></button>
      <button onClick={() => setView('catalog')} className="w-full bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition"><h3 className="font-semibold text-slate-800 text-lg">🍎 Catálogo de Alimentos</h3><p className="text-sm text-slate-500 mt-1">Procurar, editar e criar alimentos individuais gravados.</p></button>
      <button onClick={() => setView('meals')} className="w-full bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition"><h3 className="font-semibold text-slate-800 text-lg">🍱 Refeições Salvas</h3><p className="text-sm text-slate-500 mt-1">Editar e gerir conjuntos predefinidos de alimentos.</p></button>
      <button onClick={() => setView('backup')} className="w-full bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition"><h3 className="font-semibold text-slate-800 text-lg">💾 Backup de Dados</h3><p className="text-sm text-slate-500 mt-1">Exportar ou importar os seus dados em JSON.</p></button>
      <button onClick={() => setView('reset')} className="w-full bg-white p-5 rounded-[24px] shadow-sm border border-red-100 text-left hover:bg-red-50 transition"><h3 className="font-semibold text-red-600 text-lg">⚠️ Limpeza de Dados</h3><p className="text-sm text-red-400 mt-1">Apagar Diário, apagar Catálogo, ou restaurar Padrões.</p></button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
       {view !== 'menu' && <button onClick={() => setView('menu')} className="text-md-primary font-medium text-sm flex items-center gap-1 mb-2">&larr; Menu de Ajustes</button>}
       {view === 'menu' && renderMenu()}
       {view === 'goals' && <GoalsManager settings={settings} />}
       {view === 'catalog' && <CatalogManager foods={foods} />}
       {view === 'meals' && <MealsManager meals={meals} foods={foods} />}
       
       {view === 'backup' && (
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
             <h3 className="font-semibold text-slate-800 text-lg mb-6">Backup Offline</h3>
             <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Exportar</p>
                  <button onClick={() => exportData('full')} className="w-full bg-md-secondary text-white py-3 rounded-xl hover:bg-opacity-90 transition font-medium mb-2">Exportar Backup Completo</button>
                  <button onClick={() => exportData('catalog')} className="w-full bg-slate-100 text-slate-700 border border-slate-300 py-3 rounded-xl hover:bg-slate-200 transition font-medium">Exportar Apenas Catálogo</button>
                  <p className="text-xs text-slate-500 mt-2">Gera um ficheiro seguro. Pode escolher incluir todo o seu diário ou exportar apenas a sua base de alimentos e refeições.</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">Importar</p>
                  <input type="file" accept=".json" ref={fileInputRef} className="mb-3 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-md-primary/10 file:text-md-primary hover:file:bg-md-primary/20 cursor-pointer" />
                  <div className="flex gap-2">
                    <button onClick={() => handleImport('merge')} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 transition text-sm font-medium">Mesclar</button>
                    <button onClick={() => {
                        MySwal.fire({ title: 'Substituir tudo?', text: "Isto irá apagar os dados atuais.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ba1a1a', confirmButtonText: 'Sim', cancelButtonText: 'Cancelar'
                        }).then((res) => { if(res.isConfirmed) handleImport('overwrite'); });
                    }} className="flex-1 bg-red-100 text-red-700 py-2.5 rounded-xl hover:bg-red-200 transition text-sm font-medium">Substituir</button>
                  </div>
                </div>
             </div>
          </div>
       )}

       {view === 'reset' && (
          <div className="bg-red-50 p-5 rounded-[24px] shadow-sm border border-red-100">
             <h3 className="font-semibold text-red-800 text-lg mb-4">Zona de Perigo</h3>
             <div className="space-y-4">
                <button onClick={() => {
                   MySwal.fire({ title: 'Apagar Diário?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ba1a1a', confirmButtonText: 'Apagar', cancelButtonText: 'Cancelar'
                   }).then(async (result) => { if (result.isConfirmed) { await resetDiary(); MySwal.fire('Apagado!', '', 'success'); setView('menu'); } });
                }} className="w-full bg-white border-2 border-red-200 text-red-700 py-3 rounded-xl hover:bg-red-100 transition font-medium">Apagar Apenas Histórico/Diário</button>
                <button onClick={() => {
                   MySwal.fire({ title: 'Apagar Catálogo?', text: "Deseja apagar TODOS os alimentos?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ba1a1a', confirmButtonText: 'Apagar Tudo', cancelButtonText: 'Cancelar'
                   }).then(async (result) => { if (result.isConfirmed) { await resetCatalog(); MySwal.fire('Apagado!', '', 'success'); setView('menu'); } });
                }} className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition font-medium">Apagar Catálogo Completo</button>
                <div className="pt-4 mt-4 border-t border-red-200">
                    <button onClick={() => {
                       MySwal.fire({ title: 'Restaurar Padrões?', text: "Carregar os alimentos padrão da tabela TACO?", icon: 'question', showCancelButton: true, confirmButtonColor: '#386a20', confirmButtonText: 'Carregar', cancelButtonText: 'Cancelar'
                       }).then(async (result) => { if (result.isConfirmed) { const added = await restoreDefaultFoods(); MySwal.fire('Sucesso!', `${added} adicionados.`, 'success'); setView('menu'); } });
                    }} className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 transition font-medium">Restaurar Alimentos Padrão (TACO)</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}

function GoalsManager({ settings }) {
  if(!settings) return <p>Carregando...</p>;
  const st = { mode: settings.mode || 'global', global: settings.global || settings.goals || { calories: 2500, protein: 160, fat: 70, carbs: 300, water: 3000 }, custom: settings.custom || { '0':{}, '1':{}, '2':{}, '3':{}, '4':{}, '5':{}, '6':{} } };
  const [mode, setMode] = useState(st.mode); const [activeDays, setActiveDays] = useState(['1']); 
  const [formData, setFormData] = useState(mode === 'global' ? st.global : (st.custom[activeDays[0]]?.calories ? st.custom[activeDays[0]] : st.global));
  const daysMap = { '0': 'Domingo', '1': 'Segunda', '2': 'Terça', '3': 'Quarta', '4': 'Quinta', '5': 'Sexta', '6': 'Sábado' };
  const daysShortMap = { '0': 'Dom', '1': 'Seg', '2': 'Ter', '3': 'Qua', '4': 'Qui', '5': 'Sex', '6': 'Sáb' };

  const handleModeSwitch = async (newMode) => { setMode(newMode); setFormData(newMode === 'global' ? st.global : (st.custom[activeDays[0]]?.calories ? st.custom[activeDays[0]] : st.global)); await db.settings.update(1, { mode: newMode }); };
  const toggleDay = (day) => { let newDays = [...activeDays]; if(newDays.includes(day)) { newDays = newDays.filter(d => d !== day); if(newDays.length === 0) newDays = [day]; } else newDays.push(day); setActiveDays(newDays); setFormData(st.custom[newDays[0]]?.calories ? st.custom[newDays[0]] : st.global); };
  const handleResetToGlobal = () => { MySwal.fire({ title: 'Reverter Metas?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ba1a1a', confirmButtonText: 'Sim' }).then(async (res) => { if(res.isConfirmed) { await db.settings.update(1, { mode: 'custom', custom: { '0':{}, '1':{}, '2':{}, '3':{}, '4':{}, '5':{}, '6':{} } }); MySwal.fire('Metas resetadas!', '', 'success'); } }); };
  const handleClearSingleDay = (e, dKey) => { e.stopPropagation(); MySwal.fire({ title: 'Remover Meta?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ba1a1a', confirmButtonText: 'Remover' }).then(async (res) => { if(res.isConfirmed) { const newCustom = { ...st.custom }; newCustom[dKey] = {}; await db.settings.update(1, { custom: newCustom }); } }); };
  const handleMacroChange = (field, val) => { const newForm = { ...formData, [field]: val }; newForm.calories = (newForm.protein * 4) + (newForm.fat * 9) + (newForm.carbs * 4); setFormData(newForm); };

  const handleSave = async (e) => { e.preventDefault(); if (mode === 'global') { await db.settings.update(1, { mode: 'global', global: formData }); } else { const newCustom = { ...st.custom }; activeDays.forEach(d => newCustom[d] = formData); await db.settings.update(1, { mode: 'custom', custom: newCustom }); } MySwal.fire({ title: 'Sucesso!', icon: 'success', timer: 1500, showConfirmButton: false }); };

  return (
    <div className="space-y-6">
       <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 text-lg mb-4">Configurar Metas</h3>
          <div className="flex bg-slate-100 rounded-full p-1 mb-5"><button onClick={() => handleModeSwitch('global')} className={`flex-1 py-1.5 text-sm font-medium rounded-full ${mode === 'global' ? 'bg-white shadow-sm text-md-primary' : 'text-slate-500'}`}>Geral</button><button onClick={() => handleModeSwitch('custom')} className={`flex-1 py-1.5 text-sm font-medium rounded-full ${mode === 'custom' ? 'bg-white shadow-sm text-md-primary' : 'text-slate-500'}`}>Por Dia</button></div>
          {mode === 'custom' && ( <div className="mb-4"><div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">{Object.keys(daysShortMap).map(d => ( <button key={d} onClick={() => toggleDay(d)} className={`px-4 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${activeDays.includes(d) ? 'bg-md-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>{daysShortMap[d]}</button> ))}</div></div> )}
          <form onSubmit={handleSave} className="space-y-4">
             <div><label className="text-xs font-medium text-slate-500 ml-1">Calorias (Auto Calculadas)</label><input type="text" readOnly value={`${fmt(formData.calories||0)} kcal`} className="w-full mt-1 bg-slate-100 text-slate-600 border-b-2 border-slate-200 px-3 py-2 outline-none rounded-t-md font-semibold" /></div>
             <div className="grid grid-cols-3 gap-3">
                <SwipeNumberInput label="Prot (g)" value={formData.protein||0} onChange={v => handleMacroChange('protein', v)} colorClass="border-blue-500" />
                <SwipeNumberInput label="Gord (g)" value={formData.fat||0} onChange={v => handleMacroChange('fat', v)} colorClass="border-amber-500" />
                <SwipeNumberInput label="Carb (g)" value={formData.carbs||0} onChange={v => handleMacroChange('carbs', v)} colorClass="border-purple-500" />
             </div>
             <div><label className="text-xs font-medium text-slate-500 ml-1">Água (ml)</label><ClearableInput type="number" step="50" name="water" value={formData.water||''} onChange={e => setFormData({...formData, water: Number(e.target.value)})} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-cyan-500 px-3 py-2 outline-none rounded-t-md" /></div>
             <button type="submit" className="w-full bg-md-primary text-white py-3.5 rounded-full font-medium mt-2 shadow-md hover:bg-opacity-90 transition">Gravar Meta</button>
          </form>
          {mode === 'custom' && ( <div className="mt-6 pt-4 border-t border-slate-100"><button onClick={handleResetToGlobal} className="w-full bg-slate-100 text-slate-600 py-2.5 rounded-full text-sm font-medium hover:bg-slate-200 transition">Reverter todas para a Meta Geral</button></div> )}
       </div>
       <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 text-base mb-3">📋 Metas Vigentes Atuais</h3>
          {st.mode === 'global' ? ( <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-1"><p className="font-semibold text-md-primary">Modo Geral</p><p className="text-slate-600">🔥 <b>{fmt(st.global.calories)} kcal</b> | 💧 <b>{fmt(st.global.water || 3000)} ml</b></p></div> ) : (
             <div className="space-y-2">{Object.keys(daysMap).map(dKey => { const hasCustom = (st.custom[dKey] && Number(st.custom[dKey].calories) > 0); const dayGoal = hasCustom ? st.custom[dKey] : st.global; return ( <div key={dKey} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs"><div className="flex items-center gap-2"><span className="font-semibold text-slate-800">{daysMap[dKey]}</span><span className={`px-2 py-0.5 rounded-full text-[10px] ${hasCustom ? 'bg-md-primary/10 text-md-primary font-medium' : 'bg-slate-200 text-slate-500'}`}>{hasCustom ? 'Personalizado' : 'Geral'}</span></div><div className="flex items-center gap-3"><div className="text-right text-slate-600"><span className="font-bold text-slate-800">{fmt(dayGoal.calories)} kcal</span></div>{hasCustom && ( <button onClick={(e) => handleClearSingleDay(e, dKey)} className="w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 rounded-full font-bold transition-colors">&times;</button> )}</div></div> ); })}</div>
          )}
       </div>
    </div>
  );
}

function CatalogManager({ foods }) {
  const [showForm, setShowForm] = useState(false); const [showScanner, setShowScanner] = useState(false);
  const [editingId, setEditingId] = useState(null); const [searchTerm, setSearchTerm] = useState('');
  const [newFood, setNewFood] = useState({ name: '', base: '100', unit: 'g', cal: '', prot: '', fat: '', carb: '', barcode: null });

  const sortedFoods = useMemo(() => { return foods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name)); }, [foods, searchTerm]);

  const handleDelete = (e, id) => { e.stopPropagation(); MySwal.fire({ title: 'Apagar?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ba1a1a', confirmButtonText: 'Sim' }).then(async (res) => { if(res.isConfirmed) await deleteFood(id); }); };
  const handleEditClick = (f) => { setEditingId(f.id); setNewFood({ name: f.name, base: f.base_serving, unit: f.serving_unit, cal: f.calories, prot: f.macros.protein, fat: f.macros.fat, carb: f.macros.carbs, barcode: f.barcode || null }); setShowForm(true); };
  const handleCancel = () => { setEditingId(null); setShowScanner(false); setNewFood({ name: '', base: '100', unit: 'g', cal: '', prot: '', fat: '', carb: '', barcode: null }); setShowForm(false); }
  const handleUnitChange = (e) => { const u = e.target.value; setNewFood({...newFood, unit: u, base: u === 'un' ? '1' : '100'}); };

  const handleScan = async (barcode) => {
      setShowScanner(false);
      MySwal.fire({ title: 'Buscando...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
      const local = await getFoodByBarcode(barcode);
      if (local) {
          MySwal.close();
          handleEditClick(local);
          return;
      }
      const res = await fetchFoodByBarcode(barcode);
      if (res.error === "offline") {
          MySwal.fire('Offline', 'Conecte-se para buscar novos produtos.', 'warning');
          setNewFood({...newFood, barcode: barcode}); return;
      }
      if (res.data) {
          setNewFood({ name: res.data.name, base: '100', unit: 'g', cal: res.data.calories, prot: res.data.protein, fat: res.data.fat, carb: res.data.carbs, barcode: barcode });
          MySwal.close();
      } else {
          MySwal.fire('Não Encontrado', 'Produto não localizado na base global. Preencha manualmente.', 'info');
          setNewFood({...newFood, barcode: barcode});
      }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if(editingId) {
        await updateFood(editingId, { name: newFood.name, base_serving: Number(newFood.base), serving_unit: newFood.unit, calories: Number(newFood.cal), macros: { protein: Number(newFood.prot||0), fat: Number(newFood.fat||0), carbs: Number(newFood.carb||0) }, barcode: newFood.barcode });
    } else {
        await createNewFood(newFood.name, newFood.base, newFood.unit, newFood.cal, newFood.prot||0, newFood.fat||0, newFood.carb||0, newFood.barcode);
    }
    handleCancel();
  };

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
       <div className="flex justify-between items-center mb-4">
           <h3 className="font-semibold text-slate-800 text-lg">Catálogo</h3>
           <button onClick={() => showForm ? handleCancel() : setShowForm(true)} className="text-sm bg-md-primary/10 text-md-primary px-3 py-1 rounded-full font-medium">{showForm ? 'Cancelar' : '+ Novo Alimento'}</button>
       </div>

       {showForm && (
         <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
            <h4 className="font-semibold text-slate-700 mb-4">{editingId ? 'Editar Alimento' : 'Novo Alimento'}</h4>
            
            {!editingId && !showScanner && !newFood.barcode && (
                <button type="button" onClick={() => setShowScanner(true)} className="w-full bg-slate-200 text-slate-700 py-2.5 rounded-lg font-medium mb-4 flex items-center justify-center gap-2 transition-colors hover:bg-slate-300">
                    <ScanBarcode size={18} /> Ler Código de Barras
                </button>
            )}

            {showScanner && (
                <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2 text-center">Aponte a câmara para o código</p>
                    <BarcodeScanner onScan={handleScan} />
                    <button type="button" onClick={() => setShowScanner(false)} className="w-full mt-3 text-sm text-red-500 font-medium">Cancelar Leitura</button>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
               {newFood.barcode && <div className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between"><span>🏷️ {newFood.barcode}</span><button type="button" onClick={() => setNewFood({...newFood, barcode: null})} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button></div>}
               <div><label className="text-xs font-medium text-slate-500 ml-1">Nome</label><ClearableInput type="text" value={newFood.name} onChange={e=>setNewFood({...newFood, name: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-md" required /></div>
               <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Porção</label><ClearableInput type="number" step="0.1" value={newFood.base} onChange={e=>setNewFood({...newFood, base: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-md" required /></div>
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Unidade</label><select value={newFood.unit} onChange={handleUnitChange} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-md text-sm text-slate-700"><option value="g">gramas (g)</option><option value="ml">mililitros (ml)</option><option value="un">unidades (un)</option></select></div>
               </div>
               <div><label className="text-xs font-medium text-slate-500 ml-1">Kcal na Porção</label><ClearableInput type="number" step="0.1" value={newFood.cal} onChange={e=>setNewFood({...newFood, cal: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-md" required /></div>
               <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Prot</label><ClearableInput type="number" step="0.1" value={newFood.prot} onChange={e=>setNewFood({...newFood, prot: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-blue-500 px-3 py-2 outline-none rounded-md" /></div>
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Gord</label><ClearableInput type="number" step="0.1" value={newFood.fat} onChange={e=>setNewFood({...newFood, fat: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-amber-500 px-3 py-2 outline-none rounded-md" /></div>
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Carb</label><ClearableInput type="number" step="0.1" value={newFood.carb} onChange={e=>setNewFood({...newFood, carb: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-purple-500 px-3 py-2 outline-none rounded-md" /></div>
               </div>
               <button type="submit" className="w-full bg-md-tertiary text-white py-2 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transition">{editingId ? 'Guardar Alterações' : 'Gravar Alimento'}</button>
            </form>
         </div>
       )}

       {!showForm && <div className="mb-4"><ClearableInput type="text" placeholder="Procurar alimentos..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-slate-100 px-4 py-2.5 rounded-full outline-none focus:ring-2 ring-md-primary/20 text-sm" /></div>}

       <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
         {sortedFoods.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Nenhum alimento encontrado.</p>}
         {sortedFoods.map(f => (
           <div key={f.id} onClick={() => handleEditClick(f)} className="p-4 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group">
             <div className="flex justify-between items-start mb-2"><h4 className="font-medium text-slate-800 text-sm leading-tight group-hover:text-md-primary">{f.name} {f.barcode && <span className="ml-1 text-[10px] text-slate-400">🏷️</span>}</h4><button onClick={(e) => handleDelete(e, f.id)} className="text-red-400 hover:text-red-600 text-xl leading-none">&times;</button></div>
             <p className="text-xs text-slate-500 mb-1">{fmt(f.calories)} kcal / {f.base_serving}{f.serving_unit}</p>
             <div className="flex gap-2 text-[10px] text-slate-400"><span>P: {fmt(f.macros.protein)}g</span>•<span>G: {fmt(f.macros.fat)}g</span>•<span>C: {fmt(f.macros.carbs)}g</span></div>
           </div>
         ))}
       </div>
    </div>
  );
}

function MealsManager({ meals, foods }) {
  const [creating, setCreating] = useState(false); const [editingId, setEditingId] = useState(null);
  const [mealName, setMealName] = useState(''); const [items, setItems] = useState([]); 
  const [searchTermMeals, setSearchTermMeals] = useState(''); const [searchTermFoods, setSearchTermFoods] = useState(''); 
  const [selectedFood, setSelectedFood] = useState(null); const [qty, setQty] = useState('');

  const sortedMeals = useMemo(() => meals.filter(m => m.name.toLowerCase().includes(searchTermMeals.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name)), [meals, searchTermMeals]);
  const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(searchTermFoods.toLowerCase())).slice(0, 5);

  const handleAddItem = (e) => { e.preventDefault(); if(!selectedFood || !qty) return; setItems([...items, { food: selectedFood, qty: Number(qty), id: crypto.randomUUID() }]); setSelectedFood(null); setSearchTermFoods(''); setQty(''); };
  const handleEditClick = (m) => { setEditingId(m.id); setMealName(m.name); setItems(m.items); setCreating(true); };
  const handleCancel = () => { setCreating(false); setEditingId(null); setMealName(''); setItems([]); };
  const handleSaveMeal = async () => { if(!mealName || items.length === 0) { MySwal.fire('Atenção', 'Adicione itens à refeição.', 'warning'); return; } if(editingId) await updateSavedMeal(editingId, mealName, items); else await createSavedMeal(mealName, items); handleCancel(); };
  const handleDelete = (e, id) => { e.stopPropagation(); MySwal.fire({ title: 'Apagar?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ba1a1a', confirmButtonText: 'Sim' }).then(async (res) => { if(res.isConfirmed) await deleteSavedMeal(id); }); };

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
       <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-slate-800 text-lg">Refeições</h3><button onClick={() => creating ? handleCancel() : setCreating(true)} className="text-sm bg-md-primary/10 text-md-primary px-3 py-1 rounded-full font-medium">{creating ? 'Cancelar' : '+ Nova Refeição'}</button></div>
       {creating && (
         <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
            <h4 className="font-semibold text-slate-700 mb-2">{editingId ? 'Editar Refeição' : 'Criar Refeição'}</h4>
            <div><label className="text-xs font-medium text-slate-500 ml-1">Nome da Refeição</label><ClearableInput type="text" placeholder="Ex: Pão com Ovos" value={mealName} onChange={e=>setMealName(e.target.value)} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-md" required /></div>
            <div className="border-t border-slate-200 pt-4"><p className="text-xs font-medium text-slate-500 mb-2">Adicionar Alimentos:</p>{!selectedFood ? <><ClearableInput type="text" placeholder="Buscar alimento..." value={searchTermFoods} onChange={e=>setSearchTermFoods(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-md outline-none focus:border-md-primary text-sm" />{searchTermFoods && <div className="mt-2 space-y-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm max-h-40 overflow-y-auto">{filteredFoods.map(f => <div key={f.id} onClick={()=>setSelectedFood(f)} className="p-2 hover:bg-slate-50 cursor-pointer rounded text-sm text-slate-700">{f.name}</div>)}</div>}</> : <form onSubmit={handleAddItem} className="flex gap-2"><div className="flex-1"><span className="text-xs text-slate-500 block truncate">{selectedFood.name}</span><input type="number" step="0.1" placeholder={`Qtd (${selectedFood.serving_unit})`} value={qty} onChange={e=>setQty(e.target.value)} className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-md outline-none text-sm" autoFocus required /></div><button type="submit" className="self-end bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm font-medium">Add</button><button type="button" onClick={()=>setSelectedFood(null)} className="self-end bg-slate-200 text-slate-600 px-3 py-1.5 rounded-md text-sm font-medium">X</button></form>}</div>
            {items.length > 0 && <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2"><p className="text-xs font-semibold text-slate-600 border-b border-slate-100 pb-1">Itens incluídos:</p>{items.map(it => <div key={it.id} className="flex justify-between items-center text-sm"><span className="text-slate-700 truncate">{it.qty}{it.food.serving_unit} {it.food.name}</span><button onClick={()=>setItems(items.filter(x=>x.id!==it.id))} className="text-red-400 font-bold ml-2">X</button></div>)}<div className="pt-2 border-t border-slate-100 text-right"><span className="text-xs font-semibold text-md-primary block">Total: {getMealMacros(items).cal} kcal</span><span className="text-[10px] text-slate-500">P: {getMealMacros(items).p}g • G: {getMealMacros(items).f}g • C: {getMealMacros(items).c}g</span></div></div>}
            <button onClick={handleSaveMeal} className="w-full bg-md-primary text-white py-2 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transition mt-2">{editingId ? 'Guardar' : 'Gravar'}</button>
         </div>
       )}
       {!creating && (
         <>
             <div className="mb-4"><ClearableInput type="text" placeholder="Procurar refeição..." value={searchTermMeals} onChange={e=>setSearchTermMeals(e.target.value)} className="w-full bg-slate-100 px-4 py-2.5 rounded-full outline-none focus:ring-2 ring-md-primary/20 text-sm" /></div>
             <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
               {sortedMeals.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Nenhuma encontrada.</p>}
               {sortedMeals.map(m => { const mt = getMealMacros(m.items); return ( <div key={m.id} onClick={() => handleEditClick(m)} className="p-4 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group"><div className="flex justify-between items-start mb-2"><h4 className="font-medium text-slate-800 text-sm leading-tight group-hover:text-md-primary">{m.name}</h4><button onClick={(e) => handleDelete(e, m.id)} className="text-red-400 hover:text-red-600 text-xl leading-none">&times;</button></div><p className="text-xs text-slate-500 mb-1">{m.items.length} itens • <span className="font-semibold text-slate-700">{mt.cal} kcal</span></p><div className="flex flex-wrap gap-1 mt-2">{m.items.map(i => <span key={i.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{i.food.name}</span>)}</div></div> )})}
             </div>
         </>
       )}
    </div>
  );
}
