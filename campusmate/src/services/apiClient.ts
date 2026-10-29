import { auth } from './firebaseClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://campassist.onrender.com/api/v1';

// In-memory response cache for fast instantaneous repeat queries
const apiCache = new Map<string, { data: any; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
const GET_CACHE_TTL_MS = 25_000; // 25s cache for fast page navigation

export const getAccessToken = async (): Promise<string | undefined> => {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
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

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Read from in-memory cache for GET requests
  const cacheKey = `${endpoint}`;
  if (isGet) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return JSON.parse(JSON.stringify(cached.data));
    }
    // SingleFlight: deduplicate concurrent identical GET requests
    if (inFlightRequests.has(cacheKey)) {
      const shared = await inFlightRequests.get(cacheKey);
      return JSON.parse(JSON.stringify(shared));
    }
  } else {
    // Invalidate cache on mutations
    clearApiCache();
  }

  const executeRequest = async () => {
    let token = await getAccessToken();

    // Final fallback: read local storage manually
    if (!token) {
      try {
        const authKey = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (authKey) {
          const stored = JSON.parse(localStorage.getItem(authKey) || '{}');
          if (stored.access_token) token = stored.access_token;
        }
      } catch {}
    }

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

  if (isGet) {
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
