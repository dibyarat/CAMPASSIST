import { apiClient } from './apiClient';

export const authService = {
  me: () => apiClient('/users/me') as Promise<any>,
  onboard: (payload: Record<string, any>) => apiClient('/users/onboard', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateProfile: (profileData: Record<string, any>) => apiClient('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  })
};
