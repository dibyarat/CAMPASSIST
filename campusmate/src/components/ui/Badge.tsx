import React from 'react';

export const Badge = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={['inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Badge'}
  </span>
);