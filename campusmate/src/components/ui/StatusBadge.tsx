import React from 'react';

export const StatusBadge = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={['inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </span>
);