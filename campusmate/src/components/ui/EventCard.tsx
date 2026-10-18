import React from 'react';

export const EventCard = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-2xl border border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-5 shadow-[var(--card-shadow)] text-[var(--color-text)] transition-all duration-200 hover:-translate-y-0.5', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);