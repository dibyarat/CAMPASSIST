import React from 'react';

export const DataTable = ({ children, className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table className={['min-w-full divide-y divide-slate-200', className].filter(Boolean).join(' ')} {...props}>
    {children ?? <tbody><tr><td className="px-4 py-3 text-sm text-slate-500">No data</td></tr></tbody>}
  </table>
);