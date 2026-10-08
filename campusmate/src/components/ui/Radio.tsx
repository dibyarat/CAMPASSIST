import React from 'react';

export const Radio = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input type="radio" className={['h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500', className].filter(Boolean).join(' ')} {...props} />
);