import React from 'react';

export const Modal = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="dialog" className={['rounded-3xl border border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-2xl p-6 shadow-2xl text-[var(--color-text)]', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);