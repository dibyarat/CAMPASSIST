import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://campassist.onrender.com/api/v1';
let sessionLookupPromise: Promise<string | undefined> | undefined;

const getAccessToken = async () => {
  if (sessionLookupPromise) return sessionLookupPromise;

  sessionLookupPromise = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;

    const { data } = await supabase.auth.refreshSession();
    return data?.session?.access_token;
  })().finally(() => {
    sessionLookupPromise = undefined;
  });

  return sessionLookupPromise;
};

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  let token = await getAccessToken();
  
  // Final nuclear fallback: read local storage manually
  if (!token) {
    try {
      const authKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (authKey) {
        const stored = JSON.parse(localStorage.getItem(authKey) || '{}');
        if (stored.access_token) token = stored.access_token;
      }
    } catch(e) {}
  }
  
  const headers = new Headers(options.headers || {});
  
  // Only inject the Bearer token if the user is authenticated
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('Content-Type', 'application/json');

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch (e) {
      // JSON parsing failed, fallback to status text
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return null;
  }

  return response.json();
};
