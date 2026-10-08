import { apiClient } from './apiClient';

export type MapLocation = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  status: string;
};

export const mapService = {
  listApproved: () => apiClient('/map') as Promise<MapLocation[]>,
  listForModeration: () => apiClient('/map/moderation') as Promise<MapLocation[]>,
  submit: (data: { name: string; description?: string; latitude: number; longitude: number }) => apiClient('/map/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  moderate: (id: string, status: 'APPROVED' | 'REJECTED' | 'HIDDEN') => apiClient(`/map/${id}/moderate`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
};
