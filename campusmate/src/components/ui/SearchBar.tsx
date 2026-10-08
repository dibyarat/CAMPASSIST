import React from 'react';

export const SearchBar = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={['flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2', className].filter(Boolean).join(' ')}>
    <input className="w-full bg-transparent text-sm text-slate-700 outline-none" {...props} />
  </div>
);