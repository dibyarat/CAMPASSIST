import { useEffect, useState } from 'react';
import { isAndroidApp, androidBridge } from '../utils/androidBridge';
import { useNavigate } from 'react-router-dom';

/**
 * React hook to detect and adapt UI when running inside Native Android Shell.
 * - Adds 'in-android-shell' to <body> to trigger CSS header/footer hiding
 * - Registers native search and navigation dispatchers
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

    return () => {
      cleanupSearch();
      cleanupTab();
    };
  }, [navigate]);

  return { isApp, bridge: androidBridge };
}

