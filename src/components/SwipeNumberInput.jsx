import React, { useState, useRef } from 'react';

export default function SwipeNumberInput({ value, onChange, label, colorClass }) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startVal = useRef(value);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startVal.current = value;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.touches[0].clientY;
    const newVal = Math.max(0, startVal.current + Math.round(deltaY / 4));
    onChange(newVal);
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleWheel = (e) => {
     e.preventDefault();
     onChange(Math.max(0, value + (e.deltaY > 0 ? -1 : 1)));
  };

  return (
    <div>
      <label className="text-xs font-medium text-slate-500 ml-1">{label}</label>
      <div 
         className={`w-full mt-1 bg-slate-50 border-b-2 border-slate-300 focus-within:${colorClass} flex items-center justify-between px-1 py-2 outline-none rounded-t-md select-none`}
         style={{ touchAction: 'none' }}
         onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onWheel={handleWheel}
      >
         <button type="button" className="w-7 h-7 text-slate-400 font-bold hover:bg-slate-200 rounded-full flex items-center justify-center" onClick={(e) => { e.preventDefault(); onChange(Math.max(0, value - 1)); }}>-</button>
         <span className="font-semibold text-slate-800 text-lg cursor-ns-resize" title="Arraste cima/baixo">{value}</span>
         <button type="button" className="w-7 h-7 text-slate-400 font-bold hover:bg-slate-200 rounded-full flex items-center justify-center" onClick={(e) => { e.preventDefault(); onChange(value + 1); }}>+</button>
      </div>
    </div>
  );
}
