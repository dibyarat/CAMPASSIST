import { apiClient } from './apiClient';

export const locationService = {
  list: () => apiClient('/map') as Promise<any[]>,
  moderationQueue: () => apiClient('/map/moderation') as Promise<any[]>,
  submit: (payload: Record<string, any>) => apiClient('/map/submit', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
};
