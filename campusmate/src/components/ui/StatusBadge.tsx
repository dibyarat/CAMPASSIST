import React from 'react';

export const StatusBadge = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={['inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--glass-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-text)] shadow-2xs', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </span>
);