import React from 'react';

export const Tabs = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['flex gap-2 rounded-xl bg-slate-100 p-1', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Tabs'}
  </div>
);