import { useEffect, useRef, useState } from 'react';

/**
 * Triggers a one-time dashboard entrance animation per session/role login.
 * Never re-triggers when switching between sidebar sections.
 */
export function useDashboardEntrance(scopeKey: string): boolean {
  const triggeredRef = useRef(false);
  const [animate, setAnimate] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(`campassist_dash_intro_${scopeKey}`) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    try {
      sessionStorage.setItem(`campassist_dash_intro_${scopeKey}`, '1');
    } catch {}
    const timer = setTimeout(() => setAnimate(false), 900);
    return () => clearTimeout(timer);
  }, [scopeKey]);

  return animate;
}
