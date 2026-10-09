import { auth } from './firebaseClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://campassist.onrender.com/api/v1';

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
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
