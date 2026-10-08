import React from 'react';

export const AttendanceCard = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['border border-slate-200 rounded-xl bg-white p-4 shadow-sm', className].filter(Boolean).join(' ')} {...props}>
    {children ?? 'Attendance Card'}
  </div>
);