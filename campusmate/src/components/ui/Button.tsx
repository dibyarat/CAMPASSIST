import React from 'react';

export const Button = ({ children, className = '', type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type={type} className={['inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </button>
);