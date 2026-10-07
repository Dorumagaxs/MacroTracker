import React, { useState } from 'react';
import DiaryTab from './tabs/DiaryTab';
import HistoryTab from './tabs/HistoryTab';
import SettingsTab from './tabs/SettingsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('diary');
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="max-w-md mx-auto min-h-screen bg-md-surface pb-24 shadow-xl border-x border-slate-200 relative">
      <header className="p-4 bg-md-primary text-white text-center rounded-b-3xl shadow-sm">
        <h1 className="text-xl font-semibold tracking-wide">Macro Tracker</h1>
      </header>

      <main className="p-4">
        {activeTab === 'diary' && <DiaryTab selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
        {activeTab === 'history' && <HistoryTab selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 flex justify-around p-3 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('diary')} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'diary' ? 'bg-md-primary/15 text-md-primary' : 'text-slate-500'}`}>Diário</button>
        <button onClick={() => setActiveTab('history')} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-md-primary/15 text-md-primary' : 'text-slate-500'}`}>Histórico</button>
        <button onClick={() => setActiveTab('settings')} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-md-primary/15 text-md-primary' : 'text-slate-500'}`}>Ajustes</button>
      </nav>
    </div>
  );
}
