import React from 'react';

export const Tabs = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['flex gap-2 rounded-full border border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-md p-1.5 shadow-2xs text-[var(--color-text)]', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);