import { db } from '../db';
import { formatDateId } from '../utils/dateUtils';

export async function recalculateDailyTotal(date_id) {
  const entries = await db.meal_entries.where({ date_id }).toArray();
  let total_calories = 0, total_protein = 0, total_fat = 0, total_carbs = 0, total_water = 0;
  for (const entry of entries) {
     total_calories += Number(entry.calories) || 0;
     total_protein += Number(entry.macros?.protein) || 0;
     total_fat += Number(entry.macros?.fat) || 0;
     total_carbs += Number(entry.macros?.carbs) || 0;
     total_water += Number(entry.water) || 0;
  }
  await db.daily_logs.put({ date_id, total_calories, total_protein, total_fat, total_carbs, total_water });
}

export async function addWaterEntry(amount, dateObj) {
  const date_id = formatDateId(dateObj);
  await db.meal_entries.add({
    id: crypto.randomUUID(), date_id, meal_name: 'Água', food_name: 'Copo de Água', is_custom: true, is_water: true,
    qty_consumed: Number(amount), serving_unit: 'ml', calories: 0,
    macros: { protein: 0, fat: 0, carbs: 0 }, water: Number(amount),
    created_at: Date.now()
  });
  await recalculateDailyTotal(date_id);
}

export async function addCustomEntry(meal_name, calories, protein, fat, carbs, dateObj) {
  const date_id = formatDateId(dateObj);
  await db.meal_entries.add({
    id: crypto.randomUUID(), date_id, meal_name, food_name: 'Customizado', is_custom: true, is_water: false,
    qty_consumed: 1, serving_unit: 'un', calories: Number(calories),
    macros: { protein: Number(protein), fat: Number(fat), carbs: Number(carbs) },
    created_at: Date.now()
  });
  await recalculateDailyTotal(date_id);
}

export async function addFoodEntry(meal_name, food, qty_consumed, dateObj) {
  const date_id = formatDateId(dateObj);
  const ratio = Number(qty_consumed) / food.base_serving;
  await db.meal_entries.add({
    id: crypto.randomUUID(), date_id, meal_name, food_id: food.id, food_name: food.name, is_custom: false, is_water: false,
    qty_consumed: Number(qty_consumed), serving_unit: food.serving_unit,
    calories: Math.round(food.calories * ratio),
    macros: {
      protein: parseFloat((food.macros.protein * ratio).toFixed(1)),
      fat: parseFloat((food.macros.fat * ratio).toFixed(1)),
      carbs: parseFloat((food.macros.carbs * ratio).toFixed(1))
    },
    created_at: Date.now()
  });
  await recalculateDailyTotal(date_id);
}

export async function createNewFood(name, base_serving, unit, calories, protein, fat, carbs) {
  const newFood = {
    id: crypto.randomUUID(), name, base_serving: Number(base_serving), serving_unit: unit,
    calories: Number(calories), macros: { protein: Number(protein), fat: Number(fat), carbs: Number(carbs) }
  };
  await db.foods.add(newFood);
  return newFood;
}

export async function updateFood(id, updatedData) {
  await db.foods.update(id, updatedData);
}

export async function deleteFood(id) {
  await db.foods.delete(id);
}

export async function deleteEntry(id, date_id) {
  await db.meal_entries.delete(id);
  await recalculateDailyTotal(date_id);
}
