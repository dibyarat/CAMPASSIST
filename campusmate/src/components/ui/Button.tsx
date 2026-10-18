import React from 'react';

export const Button = ({ children, className = '', type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type={type} className={['inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--glass-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] shadow-xs transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98]', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </button>
);