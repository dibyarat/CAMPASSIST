import React from 'react';

export const FileCard = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-xl border border-slate-200 bg-slate-50 p-4', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'File'}
  </div>
);