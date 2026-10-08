import React from 'react';

export const ErrorState = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Something went wrong'}
  </div>
);