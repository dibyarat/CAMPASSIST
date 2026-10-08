import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://campassist.onrender.com/api/v1';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  // Grab the current active session from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(options.headers || {});
  
  // Only inject the Bearer token if the user is authenticated
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
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
