import React from 'react';

export const ConfirmDialog = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-3xl border border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-2xl p-6 shadow-2xl text-[var(--color-text)]', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);