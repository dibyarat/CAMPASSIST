import React from 'react';

export const ProgressBar = ({ className = '', value = 50, ...props }: React.HTMLAttributes<HTMLDivElement> & { value?: number }) => (
  <div className={['h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10 p-0.5 border border-[var(--color-border)]', className].filter(Boolean).join(' ')} {...props}>
    <div className="h-full rounded-full bg-gradient-brand shadow-[0_2px_8px_rgba(113,64,216,0.35)] transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);