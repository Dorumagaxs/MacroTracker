import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { createNewFood, deleteFood, createSavedMeal, deleteSavedMeal } from '../services/crud';
import { exportData, importData } from '../services/backup';

export default function SettingsTab() {
  const [view, setView] = useState('menu'); // menu, goals, catalog, meals, backup
  
  const settings = useLiveQuery(() => db.settings.get(1));
  const foods = useLiveQuery(() => db.foods.toArray()) || [];
  const meals = useLiveQuery(() => db.meals.toArray()) || [];
  
  const fileInputRef = useRef(null);
  const handleImport = async (mode) => {
     const file = fileInputRef.current.files[0];
     if(!file) return;
     const reader = new FileReader();
     reader.onload = async (e) => {
         const res = await importData(e.target.result, mode);
         if(res.success) { alert("Importação concluída com sucesso!"); setView('menu'); }
         else alert("Erro na importação: " + res.error);
     };
     reader.readAsText(file);
  };

  const renderMenu = () => (
    <div className="space-y-4">
      <button onClick={() => setView('goals')} className="w-full bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition">
        <h3 className="font-semibold text-slate-800 text-lg">🎯 Metas Nutricionais</h3>
        <p className="text-sm text-slate-500 mt-1">Definir objetivos diários e por dia da semana.</p>
      </button>
      <button onClick={() => setView('catalog')} className="w-full bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition">
        <h3 className="font-semibold text-slate-800 text-lg">🍎 Catálogo de Alimentos</h3>
        <p className="text-sm text-slate-500 mt-1">Gerir, editar e criar alimentos individuais gravados.</p>
      </button>
      <button onClick={() => setView('meals')} className="w-full bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition">
        <h3 className="font-semibold text-slate-800 text-lg">🍱 Refeições Salvas</h3>
        <p className="text-sm text-slate-500 mt-1">Criar conjuntos predefinidos de alimentos (ex: Pão com Ovos).</p>
      </button>
      <button onClick={() => setView('backup')} className="w-full bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition">
        <h3 className="font-semibold text-slate-800 text-lg">💾 Base de Dados (Backup)</h3>
        <p className="text-sm text-slate-500 mt-1">Exportar ou importar os seus dados em JSON.</p>
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
       {view !== 'menu' && (
          <button onClick={() => setView('menu')} className="text-md-primary font-medium text-sm flex items-center gap-1 mb-2">
            &larr; Menu de Ajustes
          </button>
       )}
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
                  <button onClick={exportData} className="w-full bg-md-secondary text-white py-3 rounded-xl hover:bg-opacity-90 transition font-medium">Exportar Dados (JSON)</button>
                  <p className="text-xs text-slate-500 mt-2">Gera um ficheiro seguro com todo o seu histórico, catálogo e refeições.</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">Importar</p>
                  <input type="file" accept=".json" ref={fileInputRef} className="mb-3 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-md-primary/10 file:text-md-primary hover:file:bg-md-primary/20 cursor-pointer" />
                  <div className="flex gap-2">
                    <button onClick={() => handleImport('merge')} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 transition text-sm font-medium">Mesclar Dados</button>
                    <button onClick={() => handleImport('overwrite')} className="flex-1 bg-red-100 text-red-700 py-2.5 rounded-xl hover:bg-red-200 transition text-sm font-medium">Substituir Tudo</button>
                  </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}

// Sub-componente: Gestão de Metas
function GoalsManager({ settings }) {
  if(!settings) return <p>Carregando...</p>;
  
  const st = {
    mode: settings.mode || 'global',
    global: settings.global || settings.goals || { calories: 2500, protein: 160, fat: 70, carbs: 300, water: 3000 },
    custom: settings.custom || { '0':{}, '1':{}, '2':{}, '3':{}, '4':{}, '5':{}, '6':{} }
  };

  const [mode, setMode] = useState(st.mode);
  const [activeDay, setActiveDay] = useState('1'); 
  const [formData, setFormData] = useState(mode === 'global' ? st.global : (st.custom[activeDay] || st.global));

  const daysMap = { '0': 'Domingo', '1': 'Segunda', '2': 'Terça', '3': 'Quarta', '4': 'Quinta', '5': 'Sexta', '6': 'Sábado' };

  const handleModeSwitch = async (newMode) => {
    setMode(newMode);
    setFormData(newMode === 'global' ? st.global : (st.custom[activeDay].calories ? st.custom[activeDay] : st.global));
    await db.settings.update(1, { mode: newMode });
  };

  const handleDaySwitch = (day) => {
    setActiveDay(day);
    setFormData(st.custom[day].calories ? st.custom[day] : st.global);
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: Number(e.target.value)});

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = mode === 'global' 
      ? { mode: 'global', global: formData } 
      : { mode: 'custom', custom: { ...st.custom, [activeDay]: formData } };
    await db.settings.update(1, payload);
    alert('Metas atualizadas!');
  };

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
       <h3 className="font-semibold text-slate-800 text-lg mb-4">Configurar Metas</h3>
       <div className="flex bg-slate-100 rounded-full p-1 mb-5">
         <button onClick={() => handleModeSwitch('global')} className={`flex-1 py-1.5 text-sm font-medium rounded-full ${mode === 'global' ? 'bg-white shadow-sm text-md-primary' : 'text-slate-500'}`}>Única (Geral)</button>
         <button onClick={() => handleModeSwitch('custom')} className={`flex-1 py-1.5 text-sm font-medium rounded-full ${mode === 'custom' ? 'bg-white shadow-sm text-md-primary' : 'text-slate-500'}`}>Por Dia</button>
       </div>
       {mode === 'custom' && (
         <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
           {Object.keys(daysMap).map(d => (
             <button key={d} onClick={() => handleDaySwitch(d)} className={`px-4 py-1.5 rounded-lg text-xs font-medium shrink-0 ${activeDay === d ? 'bg-md-primary text-white' : 'bg-slate-100 text-slate-600'}`}>{daysMap[d]}</button>
           ))}
         </div>
       )}
       <form onSubmit={handleSave} className="space-y-4">
          <div><label className="text-xs font-medium text-slate-500 ml-1">Calorias (kcal)</label><input type="number" name="calories" value={formData.calories||''} onChange={handleChange} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md" required /></div>
          <div className="grid grid-cols-3 gap-3">
             <div><label className="text-xs font-medium text-slate-500 ml-1">Prot (g)</label><input type="number" name="protein" value={formData.protein||''} onChange={handleChange} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-blue-500 px-3 py-2 outline-none rounded-t-md" /></div>
             <div><label className="text-xs font-medium text-slate-500 ml-1">Gord (g)</label><input type="number" name="fat" value={formData.fat||''} onChange={handleChange} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-amber-500 px-3 py-2 outline-none rounded-t-md" /></div>
             <div><label className="text-xs font-medium text-slate-500 ml-1">Carb (g)</label><input type="number" name="carbs" value={formData.carbs||''} onChange={handleChange} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-purple-500 px-3 py-2 outline-none rounded-t-md" /></div>
          </div>
          <div><label className="text-xs font-medium text-slate-500 ml-1">Água (ml)</label><input type="number" name="water" value={formData.water||''} onChange={handleChange} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-cyan-500 px-3 py-2 outline-none rounded-t-md" /></div>
          <button type="submit" className="w-full bg-md-primary text-white py-3.5 rounded-full font-medium mt-2 shadow-md hover:bg-opacity-90 transition">Gravar Meta</button>
       </form>
    </div>
  );
}

// Sub-componente: Gestão do Catálogo (com Form de Criação embutido)
function CatalogManager({ foods }) {
  const [showForm, setShowForm] = useState(false);
  const [newFood, setNewFood] = useState({ name: '', base: '100', cal: '', prot: '', fat: '', carb: '' });

  const handleDelete = async (id) => {
    if(window.confirm("Apagar este alimento do catálogo?")) await deleteFood(id);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createNewFood(newFood.name, newFood.base, 'g', newFood.cal, newFood.prot||0, newFood.fat||0, newFood.carb||0);
    setNewFood({ name: '', base: '100', cal: '', prot: '', fat: '', carb: '' });
    setShowForm(false);
  };

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
       <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800 text-lg">Catálogo</h3>
          <button onClick={() => setShowForm(!showForm)} className="text-sm bg-md-primary/10 text-md-primary px-3 py-1 rounded-full font-medium">
             {showForm ? 'Cancelar' : '+ Novo Alimento'}
          </button>
       </div>

       {showForm && (
         <form onSubmit={handleCreate} className="space-y-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
            <div><label className="text-xs font-medium text-slate-500 ml-1">Nome</label><input type="text" value={newFood.name} onChange={e=>setNewFood({...newFood, name: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-md" required /></div>
            <div className="grid grid-cols-2 gap-3">
               <div><label className="text-xs font-medium text-slate-500 ml-1">Porção (g/ml)</label><input type="number" value={newFood.base} onChange={e=>setNewFood({...newFood, base: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-md" required /></div>
               <div><label className="text-xs font-medium text-slate-500 ml-1">Kcal na Porção</label><input type="number" value={newFood.cal} onChange={e=>setNewFood({...newFood, cal: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-md" required /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
               <div><label className="text-xs font-medium text-slate-500 ml-1">Prot</label><input type="number" value={newFood.prot} onChange={e=>setNewFood({...newFood, prot: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-blue-500 px-3 py-2 outline-none rounded-md" /></div>
               <div><label className="text-xs font-medium text-slate-500 ml-1">Gord</label><input type="number" value={newFood.fat} onChange={e=>setNewFood({...newFood, fat: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-amber-500 px-3 py-2 outline-none rounded-md" /></div>
               <div><label className="text-xs font-medium text-slate-500 ml-1">Carb</label><input type="number" value={newFood.carb} onChange={e=>setNewFood({...newFood, carb: e.target.value})} className="w-full mt-1 bg-white border border-slate-200 focus:border-purple-500 px-3 py-2 outline-none rounded-md" /></div>
            </div>
            <button type="submit" className="w-full bg-md-primary text-white py-2 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transition">Gravar Alimento</button>
         </form>
       )}

       <div className="space-y-3">
         {foods.length === 0 && <p className="text-sm text-slate-400">Catálogo vazio.</p>}
         {foods.map(f => (
           <div key={f.id} className="p-4 border border-slate-100 rounded-xl">
             <div className="flex justify-between items-start mb-2">
               <h4 className="font-medium text-slate-800 text-sm leading-tight">{f.name}</h4>
               <button onClick={() => handleDelete(f.id)} className="text-red-400 hover:text-red-600 text-xl leading-none">&times;</button>
             </div>
             <p className="text-xs text-slate-500 mb-1">{f.calories} kcal / {f.base_serving}{f.serving_unit}</p>
             <div className="flex gap-2 text-[10px] text-slate-400">
               <span>P: {f.macros.protein}g</span>•<span>G: {f.macros.fat}g</span>•<span>C: {f.macros.carbs}g</span>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
}

// Sub-componente: Gestão de Refeições Salvas
function MealsManager({ meals, foods }) {
  const [creating, setCreating] = useState(false);
  const [mealName, setMealName] = useState('');
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [qty, setQty] = useState('');

  const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);

  const handleAddItem = (e) => {
      e.preventDefault();
      if(!selectedFood || !qty) return;
      setItems([...items, { food: selectedFood, qty: Number(qty), id: crypto.randomUUID() }]);
      setSelectedFood(null); setSearchTerm(''); setQty('');
  };

  const handleSaveMeal = async () => {
      if(!mealName || items.length === 0) return alert('Dê um nome à refeição e adicione pelo menos 1 alimento.');
      await createSavedMeal(mealName, items);
      setCreating(false); setMealName(''); setItems([]);
  };

  const handleDelete = async (id) => {
     if(window.confirm("Apagar esta refeição?")) await deleteSavedMeal(id);
  };

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
       <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800 text-lg">Refeições Salvas</h3>
          <button onClick={() => {setCreating(!creating); setItems([]); setMealName('');}} className="text-sm bg-md-primary/10 text-md-primary px-3 py-1 rounded-full font-medium">
             {creating ? 'Cancelar' : '+ Nova Refeição'}
          </button>
       </div>

       {creating && (
         <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
            <div>
               <label className="text-xs font-medium text-slate-500 ml-1">Nome da Refeição</label>
               <input type="text" placeholder="Ex: Pão com Ovos" value={mealName} onChange={e=>setMealName(e.target.value)} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-md" required />
            </div>

            <div className="border-t border-slate-200 pt-4">
               <p className="text-xs font-medium text-slate-500 mb-2">Adicionar Alimentos:</p>
               {!selectedFood ? (
                 <>
                   <input type="text" placeholder="Buscar alimento..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-md outline-none focus:border-md-primary text-sm" />
                   {searchTerm && (
                     <div className="mt-2 space-y-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm max-h-40 overflow-y-auto">
                        {filteredFoods.map(f => (
                           <div key={f.id} onClick={()=>setSelectedFood(f)} className="p-2 hover:bg-slate-50 cursor-pointer rounded text-sm text-slate-700">{f.name}</div>
                        ))}
                     </div>
                   )}
                 </>
               ) : (
                 <form onSubmit={handleAddItem} className="flex gap-2">
                    <div className="flex-1">
                       <span className="text-xs text-slate-500 block truncate">{selectedFood.name}</span>
                       <input type="number" placeholder={`Qtd (${selectedFood.serving_unit})`} value={qty} onChange={e=>setQty(e.target.value)} className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-md outline-none text-sm" autoFocus required />
                    </div>
                    <button type="submit" className="self-end bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm font-medium">Add</button>
                    <button type="button" onClick={()=>setSelectedFood(null)} className="self-end bg-slate-200 text-slate-600 px-3 py-1.5 rounded-md text-sm font-medium">X</button>
                 </form>
               )}
            </div>

            {items.length > 0 && (
               <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 border-b border-slate-100 pb-1">Itens incluídos:</p>
                  {items.map(it => (
                     <div key={it.id} className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 truncate">{it.qty}{it.food.serving_unit} {it.food.name}</span>
                        <button onClick={()=>setItems(items.filter(x=>x.id!==it.id))} className="text-red-400 font-bold ml-2">X</button>
                     </div>
                  ))}
               </div>
            )}

            <button onClick={handleSaveMeal} className="w-full bg-md-primary text-white py-2 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transition mt-2">Gravar Refeição</button>
         </div>
       )}

       {!creating && (
         <div className="space-y-3">
           {meals.length === 0 && <p className="text-sm text-slate-400">Nenhuma refeição salva.</p>}
           {meals.map(m => (
             <div key={m.id} className="p-4 border border-slate-100 rounded-xl">
               <div className="flex justify-between items-start mb-2">
                 <h4 className="font-medium text-slate-800 text-sm leading-tight">{m.name}</h4>
                 <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600 text-xl leading-none">&times;</button>
               </div>
               <p className="text-xs text-slate-500 mb-1">{m.items.length} alimentos agrupados</p>
               <div className="flex flex-wrap gap-1 mt-2">
                  {m.items.map(i => <span key={i.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{i.food.name}</span>)}
               </div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
}
