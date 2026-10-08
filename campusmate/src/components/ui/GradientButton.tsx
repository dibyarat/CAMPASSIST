import React from 'react';

export const GradientButton = ({ children, className = '', type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type={type} className={['inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Get Started'}
  </button>
);