import Dexie from 'dexie';
export const db = new Dexie('MacroTrackerDB');
db.version(2).stores({
  settings: 'id', foods: 'id, name', daily_logs: 'date_id', meal_entries: 'id, date_id, meal_group_id'
});
db.on('populate', () => {
  db.settings.add({ id: 1, goals: { calories: 2500, protein: 160, fat: 70, carbs: 300 } });
  db.foods.bulkAdd([
    { id: crypto.randomUUID(), name: 'Arroz Branco Cozido', base_serving: 100, serving_unit: 'g', calories: 130, macros: { protein: 2.7, fat: 0.2, carbs: 28 } },
    { id: crypto.randomUUID(), name: 'Peito de Frango Grelhado', base_serving: 100, serving_unit: 'g', calories: 165, macros: { protein: 31, fat: 3.6, carbs: 0 } },
    { id: crypto.randomUUID(), name: 'Ovo de Galinha Cozido', base_serving: 50, serving_unit: 'g', calories: 77, macros: { protein: 6.3, fat: 5.3, carbs: 0.6 } }
  ]);
});
