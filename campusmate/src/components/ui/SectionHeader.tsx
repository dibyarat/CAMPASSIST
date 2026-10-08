import React from 'react';

export const SectionHeader = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={['text-lg font-bold text-slate-900', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </h3>
);