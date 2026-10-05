
export const formatDateId = (dateObj) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};
export const getTodayStr = () => formatDateId(new Date());
export const isToday = (dateObj) => formatDateId(dateObj) === getTodayStr();
export const isTomorrow = (dateObj) => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateId(dateObj) === formatDateId(tomorrow);
};
export const isYesterday = (dateObj) => {
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  return formatDateId(dateObj) === formatDateId(yesterday);
};
