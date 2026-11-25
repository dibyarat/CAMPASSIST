import React from 'react';

export const GradientButton = ({ children, className = '', type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type={type}
    className={[
      'inline-flex items-center justify-center rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </button>
);
