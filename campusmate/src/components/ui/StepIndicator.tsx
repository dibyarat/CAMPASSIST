import React from 'react';

export const StepIndicator = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);