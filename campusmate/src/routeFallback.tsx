import { Loader2 } from 'lucide-react';

export const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-3 text-slate-500">
      <Loader2 className="animate-spin text-blue-500" size={30} />
      <span className="text-sm font-medium">Loading page…</span>
    </div>
  </div>
);
