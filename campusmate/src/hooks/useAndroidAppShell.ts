import { useEffect, useState } from 'react';
import { isAndroidApp, androidBridge } from '../utils/androidBridge';
import { useNavigate } from 'react-router-dom';

/**
 * React hook to detect and adapt UI when running inside Native Android Shell.
 * - Adds 'in-android-shell' to <body> to trigger CSS header/footer hiding
 * - Registers native search and navigation dispatchers
 * - Accurately coordinates Pull-to-Refresh so scrolling back up never triggers accidental refresh
 */
export function useAndroidAppShell() {
  const [isApp, setIsApp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const runningInShell = isAndroidApp();
    setIsApp(runningInShell);

    if (runningInShell) {
      document.body.classList.add('in-android-shell');
    }

    // Register Native Search Listener
    const cleanupSearch = androidBridge.onNativeSearch((query: string) => {
      if (query.trim()) {
        navigate(`/student/timetable?search=${encodeURIComponent(query)}`);
      }
    });

    // Register Native Tab Switch Listener
    const cleanupTab = androidBridge.onNativeTabChanged((tabId: string) => {
      switch (tabId) {
        case 'home':
          navigate('/student');
          break;
        case 'timetable':
          navigate('/student/timetable');
          break;
        case 'attendance':
          navigate('/student/attendance');
          break;
        case 'roomfinder':
          navigate('/student/find-room');
          break;
        case 'studyos':
          navigate('/student/studyos');
          break;
        case 'profile':
          navigate('/student/profile');
          break;
      }
    });

    // Coordinate pull-to-refresh: only enable when scrolled to the absolute top
    let lastState = true;
    const checkScrollState = () => {
      if (!runningInShell) return;
      const winY = window.scrollY || window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0;
      if (winY > 4) {
        if (lastState) {
          lastState = false;
          androidBridge.setPullToRefreshEnabled(false);
        }
        return;
      }
      const mainEl = document.querySelector('main');
      if (mainEl && mainEl.scrollTop > 4) {
        if (lastState) {
          lastState = false;
          androidBridge.setPullToRefreshEnabled(false);
        }
        return;
      }
      if (!lastState) {
        lastState = true;
        androidBridge.setPullToRefreshEnabled(true);
      }
    };

    window.addEventListener('scroll', checkScrollState, { capture: true, passive: true });
    window.addEventListener('touchstart', checkScrollState, { passive: true });
    window.addEventListener('touchmove', checkScrollState, { passive: true });
    window.addEventListener('touchend', checkScrollState, { passive: true });

    return () => {
      cleanupSearch();
      cleanupTab();
      window.removeEventListener('scroll', checkScrollState, true);
      window.removeEventListener('touchstart', checkScrollState);
      window.removeEventListener('touchmove', checkScrollState);
      window.removeEventListener('touchend', checkScrollState);
    };
  }, [navigate]);

  return { isApp, bridge: androidBridge };
}
