import React from 'react';

export const AttendanceCard = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['border border-[var(--color-border)] rounded-2xl bg-[var(--glass-surface)] backdrop-blur-xl p-5 shadow-[var(--card-shadow)] text-[var(--color-text)] transition-all duration-200 hover:-translate-y-0.5', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </div>
);