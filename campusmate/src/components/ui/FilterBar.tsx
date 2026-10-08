import React from 'react';

export const FilterBar = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);