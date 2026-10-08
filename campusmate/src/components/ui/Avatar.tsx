import React from 'react';

export const Avatar = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['flex items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-700 font-semibold', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);