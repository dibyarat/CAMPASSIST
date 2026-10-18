import React from 'react';

export const NotificationCard = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-2xl border border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-4 shadow-[var(--card-shadow)] text-[var(--color-text)] transition-all duration-200', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);