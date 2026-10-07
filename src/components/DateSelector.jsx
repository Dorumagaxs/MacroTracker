import React from 'react';
import { formatDateId } from '../utils/dateUtils';
export default function DateSelector({ date, onDateChange, label, onPrev, onNext }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <button onClick={onPrev} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">&lt;</button>
      <div className="relative group cursor-pointer text-center px-4 py-1 rounded-lg hover:bg-slate-50 transition-colors">
        <h3 className="font-semibold text-slate-800 flex items-center justify-center gap-2">{label} <span className="text-xs text-slate-400 group-hover:text-md-primary">📅</span></h3>
        <input type="date" value={formatDateId(date)} onChange={(e) => { if(e.target.value) { const [y, m, d] = e.target.value.split('-'); onDateChange(new Date(y, m - 1, d)); } }} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
      </div>
      <button onClick={onNext} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition-colors">&gt;</button>
    </div>
  );
}
