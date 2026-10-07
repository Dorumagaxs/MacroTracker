import Dexie from 'dexie';
import { defaultFoods } from './data/seedData';

export const db = new Dexie('MacroTrackerDB');
db.version(5).stores({
  settings: 'id', foods: 'id, name', meals: 'id, name', daily_logs: 'date_id', meal_entries: 'id, date_id, meal_group_id'
});

const defaultGoals = { calories: 2500, protein: 160, fat: 70, carbs: 300, water: 3000 };
db.on('populate', () => {
  db.settings.add({ 
    id: 1, mode: 'global', diaryMealOrder: [], global: defaultGoals, 
    custom: { '0':{}, '1':{}, '2':{}, '3':{}, '4':{}, '5':{}, '6':{} }
  });
  
  const foodsWithIds = defaultFoods.map(f => ({ ...f, id: crypto.randomUUID() }));
  db.foods.bulkAdd(foodsWithIds);
});
