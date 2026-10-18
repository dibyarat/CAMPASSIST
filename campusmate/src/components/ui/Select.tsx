import React from 'react';

export const Select = ({ children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={['w-full rounded-xl border border-[var(--color-border)] bg-[var(--glass-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-150 focus:border-[#7140D8] focus:ring-2 focus:ring-[#7140D8]/20', className].filter(Boolean).join(' ')} {...props}>
    {children ?? <option value="">Select an option</option>}
  </select>
);