export const GA_MEASUREMENT_ID = 'G-0FGJCC3BCK'; // Alternatively use import.meta.env.VITE_GA_MEASUREMENT_ID if configured

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Log a page view to GA4
 * @param url The URL of the page view
 */
export const trackPageView = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
    
    // Dev logging
    if (import.meta.env.DEV) {
      console.debug('[GA4] page_view', { page_path: url });
    }
  }
};

/**
 * Log a custom event to GA4
 * @param action The event name
 * @param params Event parameters
 */
export const trackEvent = (action: string, params?: Record<string, any>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, params);
    
    // Dev logging
    if (import.meta.env.DEV) {
      console.debug('[GA4]', action, params);
    }
  }
};
