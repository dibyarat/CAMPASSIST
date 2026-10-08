import React from 'react';

export const Dropdown = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['relative', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Dropdown'}
  </div>
);