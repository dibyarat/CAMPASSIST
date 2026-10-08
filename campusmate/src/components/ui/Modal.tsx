import React from 'react';

export const Modal = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="dialog" className={['rounded-2xl border border-slate-200 bg-white p-6 shadow-xl', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);