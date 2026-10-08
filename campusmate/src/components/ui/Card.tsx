import React from 'react';

export const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-2xl border border-slate-200 bg-white shadow-sm', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);