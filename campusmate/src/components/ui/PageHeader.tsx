import React from 'react';

export const PageHeader = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <header className={['flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-6 shadow-[var(--card-shadow)] text-[var(--color-text)]', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </header>
);