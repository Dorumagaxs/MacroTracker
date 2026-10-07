import React from 'react';
export default function ClearableInput({ value, onChange, className, type = "text", ...props }) {
  return (
    <div className="relative w-full flex items-center">
      <input type={type} value={value} onChange={onChange} className={`${className} pr-10`} {...props} />
      {value !== '' && value !== undefined && value !== null && (
        <button type="button" tabIndex="-1" onClick={(e) => { e.preventDefault(); onChange({ target: { name: props.name, value: '' } }); }} className="absolute right-3 text-slate-400 hover:text-red-500 font-bold text-lg leading-none transition-colors pb-0.5">&times;</button>
      )}
    </div>
  );
}
