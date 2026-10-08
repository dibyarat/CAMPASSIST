import { apiClient } from './apiClient';

export type AdminUser = {
  id: string;
  email: string;
  role?: string;
  profile?: {
    fullName?: string | null;
    rollNumber?: string | null;
    section?: string | null;
  } | null;
};

export const adminService = {
  listUsers: () => apiClient('/users') as Promise<AdminUser[]>,
  listCRs: () => apiClient('/users/cr') as Promise<AdminUser[]>,
  updateRole: (userId: string, role: string, sectionId?: string) => apiClient(`/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role, sectionId })
  }),
  listSections: () => apiClient('/sections') as Promise<any[]>,
  listSubjects: () => apiClient('/subjects') as Promise<any[]>,
  listRooms: () => apiClient('/rooms') as Promise<any[]>,
  deleteUser: (userId: string) => apiClient(`/users/${userId}`, { method: 'DELETE' })
};
