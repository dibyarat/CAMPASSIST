import React from 'react';

export const TimePicker = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input type="time" className={['w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white', className].filter(Boolean).join(' ')} {...props} />
);