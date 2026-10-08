import React from 'react';

export const Drawer = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['fixed inset-y-0 right-0 z-40 w-80 border-l border-slate-200 bg-white p-5 shadow-xl', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Drawer'}
  </div>
);