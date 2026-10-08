import React from 'react';

export const Select = ({ children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={['w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white', className].filter(Boolean).join(' ')} {...props}>
    {children ?? <option value="">Select an option</option>}
  </select>
);