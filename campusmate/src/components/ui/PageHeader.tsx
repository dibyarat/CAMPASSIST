import React from 'react';

export const PageHeader = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <header className={['flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Page Header'}
  </header>
);