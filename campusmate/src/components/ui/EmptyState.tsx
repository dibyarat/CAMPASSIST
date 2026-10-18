import React from 'react';

export const EmptyState = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-md p-10 text-center text-[var(--color-muted)] shadow-xs', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'No items found'}
  </div>
);