/**
 * AndroidBridge Web Utility (CampAssist)
 * Facilitates bi-directional communication with the Native Android Shell.
 * Safe for all browser environments (no-ops gracefully when running in regular browser).
 */

declare global {
  interface Window {
    AndroidBridge?: {
      updateBadge: (count: number) => void;
      updateTabBadge: (tabId: string, count: number) => void;
      openNativeShare: (title: string, url: string) => void;
      showToast: (message: string) => void;
      triggerHapticFeedback: () => void;
      getAppVersion: () => string;
      postMessage: (jsonString: string) => void;
    };
    Android?: Window['AndroidBridge'];
    __onNativeSearch?: (query: string) => void;
    __onNativeTabChanged?: (tabId: string) => void;
    __onNativeEvent?: (eventName: string, payload: any) => void;
  }
}

export const isAndroidApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return ua.includes('AndroidShell') || Boolean(window.AndroidBridge || window.Android);
};

export const getBridge = () => {
  if (typeof window === 'undefined') return null;
  return window.AndroidBridge || window.Android || null;
};

export const androidBridge = {
  isApp: isAndroidApp,

  updateBadge(count: number): void {
    const bridge = getBridge();
    if (bridge?.updateBadge) {
      bridge.updateBadge(Math.max(0, Math.floor(count)));
    }
  },

  updateTabBadge(tabId: string, count: number): void {
    const bridge = getBridge();
    if (bridge?.updateTabBadge) {
      bridge.updateTabBadge(tabId, Math.max(0, Math.floor(count)));
    }
  },

  openShare(title: string, url: string = window.location.href): void {
    const bridge = getBridge();
    if (bridge?.openNativeShare) {
      bridge.openNativeShare(title, url);
    } else if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        alert('Link copied to clipboard!');
      }).catch(() => {});
    }
  },

  showToast(message: string): void {
    const bridge = getBridge();
    if (bridge?.showToast) {
      bridge.showToast(message);
    }
  },

  triggerHaptic(): void {
    const bridge = getBridge();
    if (bridge?.triggerHapticFeedback) {
      bridge.triggerHapticFeedback();
    } else if ('vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch (_) {}
    }
  },

  getAppVersion(): string | null {
    const bridge = getBridge();
    return bridge?.getAppVersion ? bridge.getAppVersion() : null;
  },

  onNativeSearch(callback: (query: string) => void): () => void {
    window.__onNativeSearch = callback;
    return () => {
      if (window.__onNativeSearch === callback) {
        delete window.__onNativeSearch;
      }
    };
  },

  onNativeTabChanged(callback: (tabId: string) => void): () => void {
    window.__onNativeTabChanged = callback;
    return () => {
      if (window.__onNativeTabChanged === callback) {
        delete window.__onNativeTabChanged;
      }
    };
  }
};

