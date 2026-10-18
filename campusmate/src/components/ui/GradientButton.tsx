import React from 'react';

export const GradientButton = ({ children, className = '', type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type={type} className={['inline-flex items-center justify-center rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(113,64,216,0.35)] transition-all duration-150 hover:opacity-95 hover:shadow-[0_6px_22px_rgba(113,64,216,0.45)] hover:-translate-y-0.5 active:scale-[0.98]', className].filter(Boolean).join(' ')} {...props}>
    {children}
  </button>
);