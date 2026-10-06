import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { db } from '../db';
import { formatDateId, isToday, isYesterday, isTomorrow, getDailyGoal } from '../utils/dateUtils';
import { fmt, getMealMacros } from '../utils/formatUtils';
import { addCustomEntry, deleteEntry, addFoodEntry, createNewFood, addWaterEntry, addSavedMealToDiary } from '../services/crud';
import DateSelector from '../components/DateSelector';

const MySwal = withReactContent(Swal);

export default function DiaryTab({ selectedDate, setSelectedDate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  
  const [addMode, setAddMode] = useState('catalog'); 
  const [mealName, setMealName] = useState('Almoço');
  
  const [cal, setCal] = useState(''); const [prot, setProt] = useState(''); const [fat, setFat] = useState(''); const [carb, setCarb] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [consumeQty, setConsumeQty] = useState('');
  
  const [newFoodName, setNewFoodName] = useState('');
  const [baseServing, setBaseServing] = useState('100');
  const [unit, setUnit] = useState('g');
  
  const [waterAmount, setWaterAmount] = useState('');
  const [selectedMealObj, setSelectedMealObj] = useState(null);

  const targetDateStr = formatDateId(selectedDate);
  
  const rawSettings = useLiveQuery(() => db.settings.get(1));
  const activeGoals = getDailyGoal(rawSettings, selectedDate);

  const dailyLog = useLiveQuery(() => db.daily_logs.get(targetDateStr), [targetDateStr]) || { total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0, total_water: 0 };
  const mealEntries = useLiveQuery(() => db.meal_entries.where({ date_id: targetDateStr }).sortBy('created_at'), [targetDateStr]) || [];
  
  const foods = useLiveQuery(() => {
    if (!searchTerm) return db.foods.limit(20).toArray();
    return db.foods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).toArray();
  }, [searchTerm]) || [];
  
  const savedMeals = useLiveQuery(() => db.meals.toArray()) || [];

  const groupedEntries = useMemo(() => {
    return mealEntries.reduce((acc, entry) => {
      acc[entry.meal_name] = acc[entry.meal_name] || [];
      acc[entry.meal_name].push(entry);
      return acc;
    }, {});
  }, [mealEntries]);

  const orderedMealNames = useMemo(() => {
      const dbOrder = rawSettings?.diaryMealOrder || [];
      const currentGroups = Object.keys(groupedEntries);
      const combined = [...new Set([...dbOrder, ...currentGroups])].filter(name => currentGroups.includes(name));
      return combined;
  }, [groupedEntries, rawSettings]);

  const onDragEnd = async (result) => {
      if (!result.destination) return;
      const items = Array.from(orderedMealNames.filter(m => m !== 'Água'));
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      
      const currentOrder = rawSettings?.diaryMealOrder || [];
      const allNames = [...new Set([...items, ...currentOrder])];
      
      const newSavedOrder = allNames.sort((a, b) => {
          let iA = items.indexOf(a); if(iA===-1) iA=999;
          let iB = items.indexOf(b); if(iB===-1) iB=999;
          return iA - iB;
      });
      await db.settings.update(1, { diaryMealOrder: newSavedOrder });
  };

  const handleAddCustom = async (e) => { e.preventDefault(); await addCustomEntry(mealName, cal, prot || 0, fat || 0, carb || 0, selectedDate); closeModal(); };
  const handleAddFromCatalog = async (e) => { e.preventDefault(); if(!selectedFood || !consumeQty) return; await addFoodEntry(mealName, selectedFood, consumeQty, selectedDate); closeModal(); };
  const handleCreateFood = async (e) => { 
      e.preventDefault(); 
      const food = await createNewFood(newFoodName, baseServing, unit, cal, prot||0, fat||0, carb||0); 
      setSelectedFood(food); setAddMode('catalog'); setNewFoodName(''); setUnit('g');
  };
  const handleAddWater = async (e) => { e.preventDefault(); if(!waterAmount) return; await addWaterEntry(waterAmount, selectedDate); setShowWaterModal(false); setWaterAmount(''); };
  
  const handleAddSavedMeal = async () => {
     if(!selectedMealObj) return;
     await addSavedMealToDiary(mealName, selectedMealObj, selectedDate);
     closeModal();
  };

  const closeModal = () => { setShowAddModal(false); setSelectedFood(null); setSelectedMealObj(null); setConsumeQty(''); setCal(''); setProt(''); setFat(''); setCarb(''); };
  const calcPercent = (current, goal) => Math.min((current / goal) * 100, 100) || 0;
  const handlePrev = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
  const handleNext = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };
  const getLabel = () => { if(isToday(selectedDate)) return 'Hoje'; if(isYesterday(selectedDate)) return 'Ontem'; if(isTomorrow(selectedDate)) return 'Amanhã'; return selectedDate.toLocaleDateString('pt-BR'); };

  const renderMealGroup = (mName, entries, dragProps = null) => {
     const tCal = entries.reduce((s, e) => s + e.calories, 0);
     const tProt = entries.reduce((s, e) => s + (e.macros?.protein || 0), 0);
     const tFat = entries.reduce((s, e) => s + (e.macros?.fat || 0), 0);
     const tCarb = entries.reduce((s, e) => s + (e.macros?.carbs || 0), 0);

     return (
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden mb-4">
           <div {...dragProps} className={`bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center ${dragProps ? 'cursor-grab active:cursor-grabbing' : ''}`}>
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                 {dragProps && <span className="text-slate-400">⋮⋮</span>} {mName}
              </h3>
              {mName !== 'Água' && (
                  <div className="text-right">
                     <span className="text-sm font-medium text-md-primary block">{fmt(tCal)} kcal</span>
                     <span className="text-[10px] text-slate-500">P: {fmt(tProt)}g • G: {fmt(tFat)}g • C: {fmt(tCarb)}g</span>
                  </div>
              )}
           </div>
           <div className="divide-y divide-slate-50">
              {entries.map(entry => (
                <div key={entry.id} className="p-4 flex justify-between items-center">
                   <div>
                     <p className="font-medium text-slate-800 text-sm">{entry.food_name} {entry.is_custom && !entry.is_water && <span className="text-[10px] text-md-primary bg-md-primary/10 px-2 py-0.5 rounded-full ml-2">Custom</span>}</p>
                     {entry.is_water ? <p className="text-xs text-cyan-600 mt-0.5">{fmt(entry.water)} ml de Água</p> : <p className="text-xs text-slate-500 mt-0.5">{fmt(entry.qty_consumed)}{entry.serving_unit} • P: {fmt(entry.macros.protein)}g • G: {fmt(entry.macros.fat)}g • C: {fmt(entry.macros.carbs)}g</p>}
                   </div>
                   <div className="flex items-center gap-3">
                     {!entry.is_water && <span className="font-semibold text-slate-600 text-sm">{fmt(entry.calories)} kcal</span>}
                     <button onClick={() => deleteEntry(entry.id, targetDateStr)} className="text-red-400 hover:text-red-600 text-xl leading-none">&times;</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
     );
  };

  const draggables = orderedMealNames.filter(m => m !== 'Água');
  const hasWater = groupedEntries['Água'] && groupedEntries['Água'].length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
        <DateSelector date={selectedDate} onDateChange={setSelectedDate} label={getLabel()} onPrev={handlePrev} onNext={handleNext} />
        <div className="space-y-1 mb-5 border-t border-slate-100 pt-5">
          <div className="flex justify-between text-sm"><span className="font-medium text-slate-700">Calorias</span><span className="text-slate-500">{fmt(dailyLog.total_calories)} / {fmt(activeGoals.calories)} kcal</span></div>
          <div className="w-full bg-slate-100 rounded-full h-3"><div className="bg-md-primary h-3 rounded-full transition-all duration-500" style={{ width: `${calcPercent(dailyLog.total_calories, activeGoals.calories)}%` }}></div></div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Proteínas', val: dailyLog.total_protein, goal: activeGoals.protein, color: 'bg-blue-500', unit: 'g' },
            { label: 'Gorduras', val: dailyLog.total_fat, goal: activeGoals.fat, color: 'bg-amber-500', unit: 'g' },
            { label: 'Carboidratos', val: dailyLog.total_carbs, goal: activeGoals.carbs, color: 'bg-purple-500', unit: 'g' },
            { label: 'Água', val: dailyLog.total_water || 0, goal: activeGoals.water || 3000, color: 'bg-cyan-500', unit: 'ml' }
          ].map(m => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-xs"><span className="font-medium text-slate-600">{m.label}</span><span className="text-slate-400">{fmt(m.val)} / {fmt(m.goal)}{m.unit}</span></div>
              <div className="w-full bg-slate-100 rounded-full h-1.5"><div className={`${m.color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${calcPercent(m.val, m.goal)}%` }}></div></div>
            </div>
          ))}
        </div>
      </div>

      {hasWater && renderMealGroup('Água', groupedEntries['Água'])}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="diary-meals">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {draggables.map((mName, index) => {
                 const entries = groupedEntries[mName];
                 return (
                   <Draggable key={mName} draggableId={mName} index={index}>
                     {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}>
                           {renderMealGroup(mName, entries, provided.dragHandleProps)}
                        </div>
                     )}
                   </Draggable>
                 );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      <div className="flex gap-3 pt-2">
        <button onClick={() => setShowAddModal(true)} className="flex-1 py-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-[24px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
          <span className="text-xl leading-none">+</span> Alimento
        </button>
        <button onClick={() => setShowWaterModal(true)} className="flex-1 py-4 border-2 border-dashed border-cyan-200 text-cyan-600 rounded-[24px] font-medium hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2">
          <span className="text-xl leading-none">+</span> Água
        </button>
      </div>

      {/* Modal Água */}
      {showWaterModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 pb-safe animate-slide-up">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Registrar Água</h3>
            <div className="mb-6"><label className="text-xs font-medium text-slate-500 ml-1">Quantidade (ml)</label><input type="number" placeholder="Ex: 250" value={waterAmount} onChange={e=>setWaterAmount(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-cyan-500 px-4 py-3 outline-none rounded-t-md text-lg" autoFocus /></div>
            <div className="flex gap-3 mt-2">
               <button onClick={()=>setShowWaterModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-medium rounded-full hover:bg-slate-200 transition">Cancelar</button>
               <button onClick={handleAddWater} className="flex-1 py-3.5 bg-cyan-500 text-white font-medium rounded-full shadow-md hover:bg-cyan-600 transition">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alimento */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto rounded-t-3xl sm:rounded-3xl flex flex-col animate-slide-up">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">Registrar em: {getLabel()}</h3><button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-4 bg-slate-50 shrink-0">
               <label className="text-xs font-medium text-slate-500 ml-1">Refeição Destino</label>
               <input list="meal-names-list" type="text" value={mealName} onChange={e=>setMealName(e.target.value)} className="w-full mt-1 bg-white border border-slate-200 focus:border-md-primary px-3 py-2 outline-none rounded-lg transition-colors shadow-sm" placeholder="Ex: Café da Manhã" required />
               <datalist id="meal-names-list">
                  {orderedMealNames.filter(m => m !== 'Água').map(m => <option key={m} value={m} />)}
                  <option value="Café da Manhã" />
                  <option value="Almoço" />
                  <option value="Lanche da Tarde" />
                  <option value="Jantar" />
               </datalist>
            </div>
            
            <div className="flex border-b border-slate-200 shrink-0 overflow-x-auto scrollbar-hide">
              <button onClick={() => {setAddMode('catalog'); setSelectedFood(null); setSelectedMealObj(null);}} className={`px-4 py-3 text-sm font-medium shrink-0 ${addMode === 'catalog' ? 'text-md-primary border-b-2 border-md-primary' : 'text-slate-500'}`}>Catálogo</button>
              <button onClick={() => {setAddMode('meals'); setSelectedFood(null); setSelectedMealObj(null);}} className={`px-4 py-3 text-sm font-medium shrink-0 ${addMode === 'meals' ? 'text-md-primary border-b-2 border-md-primary' : 'text-slate-500'}`}>Refeições</button>
              <button onClick={() => {setAddMode('custom'); setSelectedFood(null); setSelectedMealObj(null);}} className={`px-4 py-3 text-sm font-medium shrink-0 ${addMode === 'custom' ? 'text-md-primary border-b-2 border-md-primary' : 'text-slate-500'}`}>Rápida</button>
              <button onClick={() => {setAddMode('create'); setSelectedFood(null); setSelectedMealObj(null);}} className={`px-4 py-3 text-sm font-medium shrink-0 ${addMode === 'create' ? 'text-md-primary border-b-2 border-md-primary' : 'text-slate-500'}`}>Novo</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              
              {addMode === 'catalog' && (
                <div className="space-y-4">
                  {!selectedFood ? (
                    <><input type="text" placeholder="Buscar alimento salvo..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-slate-100 px-4 py-2.5 rounded-full outline-none focus:ring-2 ring-md-primary/20 text-sm" />
                      <div className="space-y-2 mt-4">{foods.length === 0 ? <p className="text-center text-sm text-slate-400 py-4">Nenhum alimento encontrado.</p> : foods.map(f => ( <div key={f.id} onClick={() => setSelectedFood(f)} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition"><p className="font-medium text-slate-800 text-sm">{f.name}</p><p className="text-xs text-slate-500">{fmt(f.calories)} kcal por {f.base_serving}{f.serving_unit}</p></div> ))}</div>
                    </>
                  ) : (
                    <form onSubmit={handleAddFromCatalog} className="space-y-4 animate-fade-in">
                      <div className="p-4 bg-md-primary/10 rounded-xl border border-md-primary/20"><div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-md-primary">{selectedFood.name}</h4><button type="button" onClick={() => setSelectedFood(null)} className="text-xs text-md-primary underline">Voltar</button></div><p className="text-xs text-md-secondary">Base: {fmt(selectedFood.calories)} kcal / {selectedFood.base_serving}{selectedFood.serving_unit}</p></div>
                      <div><label className="text-xs font-medium text-slate-500 ml-1">Quantidade Consumida ({selectedFood.serving_unit})</label><input type="number" value={consumeQty} onChange={e=>setConsumeQty(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2.5 outline-none rounded-t-md text-lg" autoFocus required /></div>
                      <button type="submit" className="w-full bg-md-primary text-white py-3.5 rounded-full font-medium mt-6 shadow-md hover:bg-opacity-90 transition">Adicionar ao Diário</button>
                    </form>
                  )}
                </div>
              )}

              {addMode === 'meals' && (
                <div className="space-y-4">
                  {!selectedMealObj ? (
                     <div className="space-y-2">
                        {savedMeals.length === 0 ? <p className="text-center text-sm text-slate-400 py-4">Nenhuma refeição agrupada foi criada. Crie em "Ajustes".</p> : savedMeals.map(m => {
                           const mt = getMealMacros(m.items);
                           return ( 
                             <div key={m.id} onClick={() => setSelectedMealObj(m)} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                                <h4 className="font-medium text-slate-800 text-sm">{m.name}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{m.items.length} alimentos • <span className="font-semibold text-slate-700">{mt.cal} kcal</span></p>
                                <p className="text-[10px] text-slate-400 mt-1">P: {mt.p}g • G: {mt.f}g • C: {mt.c}g</p>
                             </div> 
                           );
                        })}
                     </div>
                  ) : (
                     <div className="space-y-4 animate-fade-in">
                        <div className="p-4 bg-md-primary/10 rounded-xl border border-md-primary/20">
                           <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-md-primary">{selectedMealObj.name}</h4>
                              <button type="button" onClick={() => setSelectedMealObj(null)} className="text-xs text-md-primary underline">Voltar</button>
                           </div>
                           <ul className="space-y-1 text-xs text-slate-700">
                              {selectedMealObj.items.map(i => <li key={i.id}>• {i.qty}{i.food.serving_unit} de {i.food.name}</li>)}
                           </ul>
                        </div>
                        <button onClick={handleAddSavedMeal} className="w-full bg-md-primary text-white py-3.5 rounded-full font-medium mt-6 shadow-md hover:bg-opacity-90 transition">Adicionar ao Diário</button>
                     </div>
                  )}
                </div>
              )}

              {addMode === 'custom' && (
                <form onSubmit={handleAddCustom} className="space-y-4">
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Calorias (kcal)</label><input type="number" step="0.1" value={cal} onChange={e=>setCal(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md" required /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Prot (g)</label><input type="number" step="0.1" value={prot} onChange={e=>setProt(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-blue-500 px-3 py-2 outline-none rounded-t-md" /></div>
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Gord (g)</label><input type="number" step="0.1" value={fat} onChange={e=>setFat(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-amber-500 px-3 py-2 outline-none rounded-t-md" /></div>
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Carb (g)</label><input type="number" step="0.1" value={carb} onChange={e=>setCarb(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-purple-500 px-3 py-2 outline-none rounded-t-md" /></div>
                  </div>
                  <button type="submit" className="w-full bg-md-primary text-white py-3.5 rounded-full font-medium mt-6 shadow-md hover:bg-opacity-90 transition">Salvar Entrada</button>
                </form>
              )}

              {addMode === 'create' && (
                <form onSubmit={handleCreateFood} className="space-y-4">
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Nome do Alimento</label><input type="text" value={newFoodName} onChange={e=>setNewFoodName(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md" required /></div>
                  <div className="grid grid-cols-2 gap-3">
                     <div><label className="text-xs font-medium text-slate-500 ml-1">Porção</label><input type="number" value={baseServing} onChange={e=>setBaseServing(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md" required /></div>
                     <div><label className="text-xs font-medium text-slate-500 ml-1">Unidade</label>
                        <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full mt-1 bg-white border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md text-sm text-slate-700">
                           <option value="g">gramas (g)</option>
                           <option value="ml">mililitros (ml)</option>
                           <option value="un">unidades (un)</option>
                        </select>
                     </div>
                  </div>
                  <div><label className="text-xs font-medium text-slate-500 ml-1">Kcal na Porção</label><input type="number" step="0.1" value={cal} onChange={e=>setCal(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-md-primary px-3 py-2 outline-none rounded-t-md" required /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Prot (g)</label><input type="number" step="0.1" value={prot} onChange={e=>setProt(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-blue-500 px-3 py-2 outline-none rounded-t-md" /></div>
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Gord (g)</label><input type="number" step="0.1" value={fat} onChange={e=>setFat(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-amber-500 px-3 py-2 outline-none rounded-t-md" /></div>
                    <div><label className="text-xs font-medium text-slate-500 ml-1">Carb (g)</label><input type="number" step="0.1" value={carb} onChange={e=>setCarb(e.target.value)} className="w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus:border-purple-500 px-3 py-2 outline-none rounded-t-md" /></div>
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
