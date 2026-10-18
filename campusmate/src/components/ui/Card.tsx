import React from 'react';

export const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-2xl border border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-xl shadow-[var(--card-shadow)] text-[var(--color-text)] transition-all duration-200', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);