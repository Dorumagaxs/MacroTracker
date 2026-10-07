export const formatDateId = (dateObj) => { const d = new Date(dateObj); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; };
export const getTodayStr = () => formatDateId(new Date());
export const isToday = (dateObj) => formatDateId(dateObj) === getTodayStr();
export const isTomorrow = (dateObj) => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); return formatDateId(dateObj) === formatDateId(tomorrow); };
export const isYesterday = (dateObj) => { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); return formatDateId(dateObj) === formatDateId(yesterday); };
export const getDailyGoal = (settings, dateObj) => {
   const defaultG = { calories: 2500, protein: 160, fat: 70, carbs: 300, water: 3000 };
   if (!settings) return defaultG;
   const globalG = settings.global || settings.goals || defaultG;
   if (settings.mode === 'global') return globalG;
   if (settings.custom) { const day = dateObj.getDay().toString(); const dayCustom = settings.custom[day]; if (dayCustom && Number(dayCustom.calories) > 0) return dayCustom; }
   return globalG;
};
