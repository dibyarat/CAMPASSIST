import React from 'react';

export const EmptyState = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'No items found'}
  </div>
);