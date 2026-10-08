import { apiClient } from './apiClient';

export const attendanceRequestService = {
  myDisputes: () => apiClient('/attendance/my-disputes') as Promise<any[]>,
  createDispute: (payload: Record<string, any>) => apiClient('/attendance/dispute', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getCrQueue: () => apiClient('/attendance/cr-queue') as Promise<any[]>,
  resolveRequest: (id: string, status: 'APPROVED' | 'REJECTED') => apiClient(`/attendance/cr-queue/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
};
