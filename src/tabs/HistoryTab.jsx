import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatDateId, isToday, isYesterday, isTomorrow, getDailyGoal } from '../utils/dateUtils';
import DateSelector from '../components/DateSelector';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function HistoryTab({ selectedDate, setSelectedDate }) {
  const [view, setView] = useState('daily');
  
  const rawSettings = useLiveQuery(() => db.settings.get(1));
  const allLogs = useLiveQuery(() => db.daily_logs.toArray()) || [];

  const targetDateStr = formatDateId(selectedDate);
  const activeGoals = getDailyGoal(rawSettings, selectedDate);
  const dailyLog = allLogs.find(l => l.date_id === targetDateStr) || {total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0, total_water: 0};
  
  const pKcal = dailyLog.total_protein * 4;
  const cKcal = dailyLog.total_carbs * 4;
  const fKcal = dailyLog.total_fat * 9;
  
  const pieData = [
    { name: 'Proteínas', value: pKcal, color: '#3b82f6', grams: dailyLog.total_protein },
    { name: 'Gorduras', value: fKcal, color: '#f59e0b', grams: dailyLog.total_fat },
    { name: 'Carboidratos', value: cKcal, color: '#a855f7', grams: dailyLog.total_carbs }
  ].filter(d => d.value > 0);

  const weekData = useMemo(() => {
    const first = selectedDate.getDate() - selectedDate.getDay();
    const sunday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), first);
    let sumCal = 0; const days = []; const labels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    for(let i=0; i<7; i++) {
      const d = new Date(sunday); d.setDate(sunday.getDate() + i);
      const log = allLogs.find(x => x.date_id === formatDateId(d));
      const cals = log ? log.total_calories : 0;
      const agua = log ? (log.total_water || 0) : 0;
      const prot = log ? (log.total_protein || 0) : 0;
      const fat = log ? (log.total_fat || 0) : 0;
      const carbs = log ? (log.total_carbs || 0) : 0;
      
      // Calculate dynamic goal for that specific day
      const dGoal = getDailyGoal(rawSettings, d);
      
      sumCal += cals; 
      days.push({ day: labels[i], calorias: cals, prot, fat, carbs, agua, metaKcal: dGoal.calories });
    }
    const avgCal = Math.round(sumCal / 7) || 0;
    return days.map(d => ({ ...d, media: avgCal }));
  }, [selectedDate, allLogs, rawSettings]);

  const monthData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let sumCal = 0; const days = [];
    for(let i=1; i<=daysInMonth; i++) {
      const d = new Date(year, month, i);
      const log = allLogs.find(x => x.date_id === formatDateId(d));
      const cals = log ? log.total_calories : 0;
      const agua = log ? (log.total_water || 0) : 0;
      const prot = log ? (log.total_protein || 0) : 0;
      const fat = log ? (log.total_fat || 0) : 0;
      const carbs = log ? (log.total_carbs || 0) : 0;
      
      const dGoal = getDailyGoal(rawSettings, d);

      sumCal += cals; 
      days.push({ day: String(i), calorias: cals, prot, fat, carbs, agua, metaKcal: dGoal.calories });
    }
    const avgCal = Math.round(sumCal / daysInMonth) || 0;
    return days.map(d => ({ ...d, media: avgCal }));
  }, [selectedDate, allLogs, rawSettings]);

  const handlePrev = () => {
    const d = new Date(selectedDate);
    if(view === 'daily') d.setDate(d.getDate() - 1);
    else if(view === 'weekly') d.setDate(d.getDate() - 7);
    else if(view === 'monthly') d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if(view === 'daily') d.setDate(d.getDate() + 1);
    else if(view === 'weekly') d.setDate(d.getDate() + 7);
    else if(view === 'monthly') d.setMonth(d.getMonth() + 1);
    setSelectedDate(d);
  };

  const getLabel = () => {
    if(view === 'daily') {
      if(isToday(selectedDate)) return 'Hoje';
      if(isYesterday(selectedDate)) return 'Ontem';
      if(isTomorrow(selectedDate)) return 'Amanhã';
      return selectedDate.toLocaleDateString('pt-BR');
    }
    if(view === 'weekly') {
      const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - selectedDate.getDay());
      const last = new Date(first); last.setDate(last.getDate() + 6);
      return `${first.toLocaleDateString('pt-BR').slice(0,5)} a ${last.toLocaleDateString('pt-BR').slice(0,5)}`;
    }
    if(view === 'monthly') {
      const mes = selectedDate.toLocaleString('pt-BR', { month: 'long' });
      return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${selectedDate.getFullYear()}`;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-sm min-w-[150px]">
          <p className="font-semibold text-slate-800 mb-2 border-b border-slate-50 pb-1">{label}</p>
          <p className="text-md-primary mb-1">Calorias: <span className="font-bold">{data.calorias} / {data.metaKcal} kcal</span></p>
          <p className="text-xs text-blue-600">Proteínas: {data.prot}g</p>
          <p className="text-xs text-amber-600">Gorduras: {data.fat}g</p>
          <p className="text-xs text-purple-600 mb-2">Carboidratos: {data.carbs}g</p>
          <p className="text-cyan-600 pt-2 border-t border-slate-100">Água: <span className="font-bold">{data.agua} ml</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-sm">
          <p className="font-semibold" style={{ color: data.color }}>{data.name}</p>
          <p className="text-slate-600">{Math.round(data.value)} kcal ({(data.value / (pKcal+cKcal+fKcal) * 100).toFixed(0)}%)</p>
          <p className="text-slate-500 text-xs">({data.grams.toFixed(1)}g)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 rounded-full p-1 shadow-inner">
        {['daily', 'weekly', 'monthly'].map((mode) => (
          <button key={mode} onClick={() => setView(mode)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-full transition-all ${view === mode ? 'bg-white shadow-sm text-md-primary' : 'text-slate-500 hover:text-slate-700'}`}>
            {mode === 'daily' ? 'Dia' : mode === 'weekly' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 animate-fade-in">
        <DateSelector date={selectedDate} onDateChange={setSelectedDate} label={getLabel()} onPrev={handlePrev} onNext={handleNext} />

        {view === 'daily' && (
          dailyLog.total_calories === 0 && (dailyLog.total_water || 0) === 0 ? (
            <p className="text-center text-slate-400 py-10">Nenhum consumo registrado.</p>
          ) : (
            <>
              {dailyLog.total_calories > 0 && (
                <div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">{pieData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}</Pie><Tooltip content={<CustomPieTooltip />} /></PieChart></ResponsiveContainer></div>
              )}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center"><p className="text-xs text-slate-500 font-medium">Calorias</p><p className="text-lg font-bold text-slate-800">{dailyLog.total_calories} kcal</p></div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-center"><p className="text-xs text-blue-600/70 font-medium">Proteínas</p><p className="text-lg font-bold text-blue-600">{dailyLog.total_protein}g</p></div>
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 text-center"><p className="text-xs text-amber-600/70 font-medium">Gorduras</p><p className="text-lg font-bold text-amber-600">{dailyLog.total_fat}g</p></div>
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100/50 text-center"><p className="text-xs text-purple-600/70 font-medium">Carboidratos</p><p className="text-lg font-bold text-purple-600">{dailyLog.total_carbs}g</p></div>
                <div className="bg-cyan-50/50 p-3 rounded-xl border border-cyan-100/50 text-center"><p className="text-xs text-cyan-600/70 font-medium">Água</p><p className="text-lg font-bold text-cyan-600">{dailyLog.total_water || 0} ml</p></div>
              </div>
            </>
          )
        )}

        {(view === 'weekly' || view === 'monthly') && (
          <>
            <div className="mb-6">
              <p className="text-xs text-slate-500 text-center">Média Calórica: <span className="font-medium text-red-500">{view === 'weekly' ? weekData[0]?.media : monthData[0]?.media} kcal/dia</span></p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={view === 'weekly' ? weekData : monthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval={view === 'monthly' ? 4 : 0} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                  <Bar yAxisId="left" dataKey="calorias" fill="#386a20" radius={[4,4,0,0]} maxBarSize={40} />
                  <Line yAxisId="left" type="monotone" dataKey="agua" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="metaKcal" stroke="#ba1a1a" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
