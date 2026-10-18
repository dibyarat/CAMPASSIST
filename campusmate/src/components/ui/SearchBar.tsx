import React from 'react';

export const SearchBar = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={['flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--glass-surface)] backdrop-blur-md px-4 py-2.5 text-sm text-[var(--color-text)] transition focus-within:border-[#7140D8] focus-within:ring-2 focus-within:ring-[#7140D8]/20', className].filter(Boolean).join(' ')}>
    <input className="w-full bg-transparent text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none" {...props} />
  </div>
);