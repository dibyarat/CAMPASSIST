import React from 'react';

export const FileUpload = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input type="file" className={['block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600', className].filter(Boolean).join(' ')} {...props} />
);