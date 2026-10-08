import React from 'react';

export const ReminderCard = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['rounded-xl border border-slate-200 bg-white p-4 shadow-sm', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Reminder'}
  </div>
);