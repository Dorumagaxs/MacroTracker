import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatDateId, isToday, isYesterday, isTomorrow } from '../utils/dateUtils';
import { addCustomEntry, deleteEntry, addFoodEntry, createNewFood } from '../services/crud';
import DateSelector from '../components/DateSelector';

export default function DiaryTab({ selectedDate, setSelectedDate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('catalog');
  const [mealName, setMealName] = useState('Almoço');
  const [cal, setCal] = useState('');
  const [prot, setProt] = useState('');
  const [fat, setFat] = useState('');
  const [carb, setCarb] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [consumeQty, setConsumeQty] = useState('');
  const [newFoodName, setNewFoodName] = useState('');
  const [baseServing, setBaseServing] = useState('100');

  const targetDateStr = formatDateId(selectedDate);
  
  const settings = useLiveQuery(() => db.settings.get(1)) || { goals: { calories: 2500, protein: 160, fat: 70, carbs: 300 } };
  
  // O bug foi resolvido aqui: As dependências [targetDateStr] garantem que o Dexie re-execute a consulta ao mudar de data.
  const dailyLog = useLiveQuery(() => db.daily_logs.get(targetDateStr), [targetDateStr]) || { total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0 };
  const mealEntries = useLiveQuery(() => db.meal_entries.where({ date_id: targetDateStr }).sortBy('created_at'), [targetDateStr]) || [];
  
  const foods = useLiveQuery(() => {
    if (!searchTerm) return db.foods.limit(20).toArray();
    return db.foods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).toArray();
  }, [searchTerm]) || [];

  const groupedEntries = useMemo(() => {
    return mealEntries.reduce((acc, entry) => {
      acc[entry.meal_name] = acc[entry.meal_name] || [];
      acc[entry.meal_name].push(entry);
      return acc;
    }, {});
  }, [mealEntries]);

  const handleAddCustom = async (e) => {
    e.preventDefault();
    await addCustomEntry(mealName, cal, prot || 0, fat || 0, carb || 0, selectedDate);
    closeModal();
  };

  const handleAddFromCatalog = async (e) => {
    e.preventDefault();
    if(!selectedFood || !consumeQty) return;
    await addFoodEntry(mealName, selectedFood, consumeQty, selectedDate);
    closeModal();
  };

  const handleCreateFood = async (e) => {
    e.preventDefault();
    const food = await createNewFood(newFoodName, baseServing, 'g', cal, prot||0, fat||0, carb||0);
    setSelectedFood(food);
    setAddMode('catalog');
    setNewFoodName('');
  };

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedFood(null); setConsumeQty(''); setCal(''); setProt(''); setFat(''); setCarb('');
  };

  const calcPercent = (current, goal) => Math.min((current / goal) * 100, 100) || 0;

  const handlePrev = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
  const handleNext = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };

  const getLabel = () => {
      if(isToday(selectedDate)) return 'Hoje';
      if(isYesterday(selectedDate)) return 'Ontem';
      if(isTomorrow(selectedDate)) return 'Amanhã';
      return selectedDate.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
        
        {/* Seletor de Data Integrado */}
        <DateSelector date={selectedDate} onDateChange={setSelectedDate} label={getLabel()} onPrev={handlePrev} onNext={handleNext} />

        <div className="space-y-1 mb-5 border-t border-slate-100 pt-5">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-700">Calorias</span>
            <span className="text-slate-500">{dailyLog.total_calories} / {settings.goals.calories} kcal</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-md-primary h-3 rounded-full transition-all duration-500" style={{ width: `${calcPercent(dailyLog.total_calories, settings.goals.calories)}%` }}></div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Proteínas', val: dailyLog.total_protein, goal: settings.goals.protein, color: 'bg-blue-500' },
            { label: 'Gorduras', val: dailyLog.total_fat, goal: settings.goals.fat, color: 'bg-amber-500' },
            { label: 'Carboidratos', val: dailyLog.total_carbs, goal: settings.goals.carbs, color: 'bg-purple-500' }
          ].map(m => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">{m.label}</span>
                <span className="text-slate-400">{m.val} / {m.goal}g</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className={`${m.color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${calcPercent(m.val, m.goal)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
         {Object.entries(groupedEntries).map(([mName, entries]) => (
           <div key={mName} className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-semibold text-slate-700">{mName}</h3>
                 <span className="text-sm font-medium text-md-primary">
                    {entries.reduce((sum, e) => sum + e.calories, 0)} kcal
                 </span>
              </div>
              <div className="divide-y divide-slate-50">
                 {entries.map(entry => (
                   <div key={entry.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">
                          {entry.food_name} 
                          {entry.is_custom && <span className="text-[10px] text-md-primary bg-md-primary/10 px-2 py-0.5 rounded-full ml-2">Custom</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {entry.qty_consumed}{entry.serving_unit} • P: {entry.macros.protein}g • G: {entry.macros.fat}g • C: {entry.macros.carbs}g
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-600 text-sm">{entry.calories} kcal</span>
                        <button onClick={() => deleteEntry(entry.id, targetDateStr)} className="text-red-400 hover:text-red-600 text-xl leading-none">&times;</button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         ))}
      </div>
      
      <button onClick={() => setShowAddModal(true)} className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-[24px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
        <span className="text-xl leading-none">+</span> Adicionar Alimento
      </button>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto rounded-t-3xl sm:rounded-3xl flex flex-col animate-slide-up">
            
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">Registrar em: {getLabel()}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>

            <div className="p-4 bg-slate-50 shrink-0">
               <label className="text-xs font-medium text-slate-500 ml-1">Refeição Destino</label>
               <input type="text" value={mealName} onChange={e=>setMealName(e.target.value)} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-lg transition-colors shadow-sm" placeholder="Ex: Café da Manhã" required />
            </div>

            <div className="flex border-b border-slate-200 shrink-0">
              <button onClick={() => setAddMode('catalog')} className={`flex-1 py-3 text-sm font-medium ${addMode === 'catalog' ? 'text-md-primary border-b-2 border-md-primary' : 'text-slate-500'}`}>Catálogo</button>
              <button onClick={() => setAddMode('custom')} className={`flex-1 py-3 text-sm font-medium ${addMode === 'custom' ? 'text-md-primary border-b-2 border-md-primary' : 'text-slate-500'}`}>Entrada Rápida</button>
              <button onClick={() => setAddMode('create')} className={`flex-1 py-3 text-sm font-medium ${addMode === 'create' ? 'text-md-primary border-b-2 border-md-primary' : 'text-slate-500'}`}>Novo Alimento</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              
              {addMode === 'catalog' && (
                <div className="space-y-4">
                  {!selectedFood ? (
                    <>
                      <input type="text" placeholder="Buscar alimento salvo..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-slate-100 px-4 py-2.5 rounded-full outline-none focus:ring-2 ring-md-primary/20 text-sm" />
                      <div className="space-y-2 mt-4">
                        {foods.length === 0 ? (
                           <p className="text-center text-sm text-slate-400 py-4">Nenhum alimento encontrado.</p>
                        ) : (
                           foods.map(f => (
                             <div key={f.id} onClick={() => setSelectedFood(f)} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                                <p className="font-medium text-slate-800 text-sm">{f.name}</p>
                                <p className="text-xs text-slate-500">{f.calories} kcal por {f.base_serving}{f.serving_unit}</p>
                             </div>
                           ))
                        )}
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleAddFromCatalog} className="space-y-4 animate-fade-in">
                      <div className="p-4 bg-md-primary/10 rounded-xl border border-md-primary/20">
                         <div className="flex justify-between items-center mb-2">
                           <h4 className="font-semibold text-md-primary">{selectedFood.name}</h4>
                           <button type="button" onClick={() => setSelectedFood(null)} className="text-xs text-md-primary underline">Voltar</button>
                         </div>
                         <p className="text-xs text-md-secondary">Base: {selectedFood.calories} kcal / {selectedFood.base_serving}{selectedFood.serving_unit}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 ml-1">Quantidade Consumida ({selectedFood.serving_unit})</label>
                        <input type="number" value={consumeQty} onChange={e=>setConsumeQty(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2.5 outline-none rounded-t-md text-lg" autoFocus required />
                      </div>
                      <button type="submit" className="w-full bg-md-primary text-white py-3.5 rounded-full font-medium mt-6 shadow-md hover:bg-opacity-90 transition">Adicionar ao Diário</button>
                    </form>
                  )}
                </div>
              )}

              {addMode === 'custom' && (
                <form onSubmit={handleAddCustom} className="space-y-4">
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Calorias (kcal)</label><input type="number" value={cal} onChange={e=>setCal(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md" required /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Prot (g)</label><input type="number" value={prot} onChange={e=>setProt(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-blue-500 px-3 py-2 outline-none rounded-t-md" /></div>
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Gord (g)</label><input type="number" value={fat} onChange={e=>setFat(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-amber-500 px-3 py-2 outline-none rounded-t-md" /></div>
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Carb (g)</label><input type="number" value={carb} onChange={e=>setCarb(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-purple-500 px-3 py-2 outline-none rounded-t-md" /></div>
                  </div>
                  <button type="submit" className="w-full bg-md-primary text-white py-3.5 rounded-full font-medium mt-6 shadow-md hover:bg-opacity-90 transition">Salvar Entrada</button>
                </form>
              )}

              {addMode === 'create' && (
                <form onSubmit={handleCreateFood} className="space-y-4">
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Nome do Alimento</label><input type="text" value={newFoodName} onChange={e=>setNewFoodName(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md" required /></div>
                  <div className="grid grid-cols-2 gap-3">
                     <div><label className="text-xs font-medium text-slate-500 ml-1">Porção (g/ml)</label><input type="number" value={baseServing} onChange={e=>setBaseServing(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md" required /></div>
                     <div><label className="text-xs font-medium text-slate-500 ml-1">Kcal na Porção</label><input type="number" value={cal} onChange={e=>setCal(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md" required /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Prot (g)</label><input type="number" value={prot} onChange={e=>setProt(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-blue-500 px-3 py-2 outline-none rounded-t-md" /></div>
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Gord (g)</label><input type="number" value={fat} onChange={e=>setFat(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-amber-500 px-3 py-2 outline-none rounded-t-md" /></div>
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Carb (g)</label><input type="number" value={carb} onChange={e=>setCarb(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-purple-500 px-3 py-2 outline-none rounded-t-md" /></div>
                  </div>
                  <button type="submit" className="w-full bg-md-tertiary text-white py-3.5 rounded-full font-medium mt-6 shadow-md hover:bg-opacity-90 transition">Salvar no Catálogo</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
