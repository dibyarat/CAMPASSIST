import React from 'react';

export const StatCard = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);