import React from 'react';

export const ProgressBar = ({ className = '', value = 50, ...props }: React.HTMLAttributes<HTMLDivElement> & { value?: number }) => (
  <div className={['h-2.5 w-full overflow-hidden rounded-full bg-slate-200', className].filter(Boolean).join(' ')} {...props}>
    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);