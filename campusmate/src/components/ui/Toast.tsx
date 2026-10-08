import React from 'react';

export const Toast = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Success'}
  </div>
);