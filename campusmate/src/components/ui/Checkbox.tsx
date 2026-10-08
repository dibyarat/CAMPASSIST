import React from 'react';

export const Checkbox = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input type="checkbox" className={['h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500', className].filter(Boolean).join(' ')} {...props} />
);