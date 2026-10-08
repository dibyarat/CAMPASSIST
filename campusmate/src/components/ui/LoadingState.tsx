import React from 'react';

export const LoadingState = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Loading...'}
  </div>
);