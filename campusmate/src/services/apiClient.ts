import { auth } from './firebaseClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://campassist.onrender.com/api/v1';

// In-memory response cache for fast instantaneous repeat queries
const apiCache = new Map<string, { data: any; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
const GET_CACHE_TTL_MS = 25_000; // 25s cache for fast page navigation

// One-time cleanup of obsolete legacy Supabase storage keys that might poison headers
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToRemove = Object.keys(localStorage).filter(
      (k) => (k.startsWith('sb-') && k.endsWith('-auth-token')) || k === 'supabase.auth.token'
    );
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
} catch {}

/**
 * Retrieves a valid Firebase ID token.
 * If Firebase is still restoring session from IndexedDB/Storage, awaits auth readiness.
 * If forceRefresh is true, requests a brand-new token from Google's token service.
 */
export const getAccessToken = async (forceRefresh = false): Promise<string | undefined> => {
  let user = auth.currentUser;

  // If user is null, wait for Firebase Auth to finish restoring the session
  if (!user) {
    if (typeof (auth as any).authStateReady === 'function') {
      try {
        await (auth as any).authStateReady();
        user = auth.currentUser;
      } catch (e) {
        console.warn('authStateReady error:', e);
      }
    }

    if (!user) {
      user = await new Promise<any>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 3500);
        const unsubscribe = auth.onAuthStateChanged((u) => {
          clearTimeout(timeout);
          unsubscribe();
          resolve(u);
        });
      });
    }
  }

  if (user) {
    try {
      const token = await user.getIdToken(forceRefresh);
      if (token) return token;
    } catch (e) {
      console.warn('Failed to get Firebase token', e);
    }
  }

  return undefined;
};

export const clearApiCache = (prefix?: string) => {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(prefix)) {
      apiCache.delete(key);
    }
  }
};

export interface ApiClientOptions extends RequestInit {
  _isRetry?: boolean;
}

export const apiClient = async (endpoint: string, options: ApiClientOptions = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Read from in-memory cache for GET requests
  const cacheKey = `${endpoint}`;
  if (isGet && !options._isRetry) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return JSON.parse(JSON.stringify(cached.data));
    }
    // SingleFlight: deduplicate concurrent identical GET requests
    if (inFlightRequests.has(cacheKey)) {
      const shared = await inFlightRequests.get(cacheKey);
      return JSON.parse(JSON.stringify(shared));
    }
  } else if (!isGet) {
    // Invalidate cache on mutations
    clearApiCache();
  }

  const executeRequest = async (): Promise<any> => {
    let token = await getAccessToken(false);

    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response: Response | null = null;
    let attempts = 0;
    const maxAttempts = isGet ? 2 : 1;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        response = await fetch(`${BASE_URL}${endpoint}`, config);

        // Auto-retry transient cold start / gateway timeouts on Render
        if ((response.status === 502 || response.status === 503 || response.status === 504) && attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        break;
      } catch (networkErr) {
        if (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        throw networkErr;
      }
    }

    if (!response) {
      throw new Error('Network request failed');
    }

    // Auto-refresh token and retry on 401 Unauthorized (e.g. Firebase 1-hour token expiration)
    if (response.status === 401 && !options._isRetry) {
      apiCache.delete(cacheKey);
      const freshToken = await getAccessToken(true);
      if (freshToken && freshToken !== token) {
        return apiClient(endpoint, {
          ...options,
          _isRetry: true,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${freshToken}`,
          },
        });
      }

      // If refresh also failed or user not logged in, trigger session expiration
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('campassist:session-expired'));
      }
    }

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText;
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (isGet) {
      apiCache.set(cacheKey, { data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
    }

    return data;
  };

  if (isGet && !options._isRetry) {
    const promise = executeRequest();
    inFlightRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  }

  return executeRequest();
};
