import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatDateId, isToday, isYesterday, isTomorrow } from '../utils/dateUtils';
import DateSelector from '../components/DateSelector';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function HistoryTab({ selectedDate, setSelectedDate }) {
  const [view, setView] = useState('daily');
  const allLogs = useLiveQuery(() => db.daily_logs.toArray()) || [];

  const targetDateStr = formatDateId(selectedDate);
  const dailyLog = allLogs.find(l => l.date_id === targetDateStr) || {total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0};
  
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
    let sum = 0; const days = []; const labels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    for(let i=0; i<7; i++) {
      const d = new Date(sunday); d.setDate(sunday.getDate() + i);
      const log = allLogs.find(x => x.date_id === formatDateId(d));
      const cals = log ? log.total_calories : 0;
      sum += cals; days.push({ day: labels[i], calorias: cals });
    }
    const avg = Math.round(sum / 7) || 0;
    return days.map(d => ({ ...d, media: avg }));
  }, [selectedDate, allLogs]);

  const monthData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let sum = 0; const days = [];
    for(let i=1; i<=daysInMonth; i++) {
      const d = new Date(year, month, i);
      const log = allLogs.find(x => x.date_id === formatDateId(d));
      const cals = log ? log.total_calories : 0;
      sum += cals; days.push({ day: String(i), calorias: cals });
    }
    const avg = Math.round(sum / daysInMonth) || 0;
    return days.map(d => ({ ...d, media: avg }));
  }, [selectedDate, allLogs]);

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
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-sm">
          <p className="font-semibold text-slate-800 mb-1">{label}</p>
          <p className="text-md-primary">Consumo: <span className="font-bold">{payload[0].value} kcal</span></p>
          {payload[1] && <p className="text-red-500">Média: {payload[1].value} kcal</p>}
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
          dailyLog.total_calories === 0 ? (
            <p className="text-center text-slate-400 py-10">Nenhum consumo registrado.</p>
          ) : (
            <>
              <div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">{pieData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}</Pie><Tooltip content={<CustomPieTooltip />} /></PieChart></ResponsiveContainer></div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center"><p className="text-xs text-slate-500 font-medium">Calorias</p><p className="text-lg font-bold text-slate-800">{dailyLog.total_calories} kcal</p></div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-center"><p className="text-xs text-blue-600/70 font-medium">Proteínas</p><p className="text-lg font-bold text-blue-600">{dailyLog.total_protein}g</p></div>
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 text-center"><p className="text-xs text-amber-600/70 font-medium">Gorduras</p><p className="text-lg font-bold text-amber-600">{dailyLog.total_fat}g</p></div>
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100/50 text-center"><p className="text-xs text-purple-600/70 font-medium">Carbos</p><p className="text-lg font-bold text-purple-600">{dailyLog.total_carbs}g</p></div>
              </div>
            </>
          )
        )}

        {(view === 'weekly' || view === 'monthly') && (
          <>
            <div className="mb-6">
              <p className="text-xs text-slate-500 text-center">Média: <span className="font-medium text-red-500">{view === 'weekly' ? weekData[0]?.media : monthData[0]?.media} kcal/dia</span></p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={view === 'weekly' ? weekData : monthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval={view === 'monthly' ? 4 : 0} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="calorias" fill="#386a20" radius={[4,4,0,0]} maxBarSize={40} />
                  <Line type="monotone" dataKey="media" stroke="#ba1a1a" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
