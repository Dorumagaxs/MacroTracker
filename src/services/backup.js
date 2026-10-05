import { db } from '../db';
export async function exportData() {
    const data = {
        settings: await db.settings.toArray(), foods: await db.foods.toArray(), meals: await db.meals.toArray(),
        daily_logs: await db.daily_logs.toArray(), meal_entries: await db.meal_entries.toArray()
    };
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `macro-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
}
export async function importData(jsonString, mode) {
    try {
        const data = JSON.parse(jsonString);
        if (mode === 'overwrite') {
            await db.settings.clear(); await db.foods.clear(); await db.meals.clear();
            await db.daily_logs.clear(); await db.meal_entries.clear();
        }
        if (data.settings && data.settings.length > 0) await db.settings.bulkPut(data.settings);
        if (data.foods && data.foods.length > 0) await db.foods.bulkPut(data.foods);
        if (data.meals && data.meals.length > 0) await db.meals.bulkPut(data.meals);
        if (data.daily_logs && data.daily_logs.length > 0) await db.daily_logs.bulkPut(data.daily_logs);
        if (data.meal_entries && data.meal_entries.length > 0) await db.meal_entries.bulkPut(data.meal_entries);
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
}
