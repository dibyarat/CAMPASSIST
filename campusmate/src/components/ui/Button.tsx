import React from 'react';

export const Button = ({ children, className = '', type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type={type}
    className={[
      'inline-flex items-center justify-center rounded-full border border-blue-600/35 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-xs transition-all duration-150 hover:bg-blue-50 hover:border-blue-600 active:bg-blue-100 dark:bg-white/5 dark:text-blue-300 dark:border-blue-400/40 dark:hover:bg-blue-500/15 active:scale-[0.98]',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </button>
);
