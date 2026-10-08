import { apiClient } from './apiClient';

export type AdminUser = {
  id: string;
  email: string;
  role?: string;
  institutionId?: string | null;
  student?: { sectionId?: string | null; section?: { name?: string } | null } | null;
  crAssignment?: { sectionId?: string; section?: { name?: string } | null } | null;
  Institution?: { id?: string; name?: string; code?: string } | null;
  profile?: {
    fullName?: string | null;
    rollNumber?: string | null;
    section?: string | null;
    department?: string | null;
    semester?: string | null;
    studentType?: 'HOSTELLER' | 'DAY_SCHOLAR';
    hostelName?: string | null;
    hostelBlock?: string | null;
    hostelRoom?: string | null;
    github?: string | null;
    linkedin?: string | null;
    portfolio?: string | null;
  } | null;
};

export type AdminSection = {
  id: string;
  name: string;
  department?: { code?: string; name?: string };
  semester?: { id: string; number: number; name: string };
};

export type AdminInstitution = {
  id: string;
  name: string;
  code: string;
};

export const adminService = {
  listUsers: () => apiClient('/users') as Promise<AdminUser[]>,
  listStudents: async () => (await apiClient('/users') as AdminUser[]).filter(user => user.role === 'STUDENT'),
  listCRs: () => apiClient('/users/cr') as Promise<AdminUser[]>,
  updateRole: (userId: string, role: string, sectionId?: string) => apiClient(`/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role, sectionId })
  }),
  listSections: () => apiClient('/sections') as Promise<AdminSection[]>,
  listInstitutions: () => apiClient('/institutions') as Promise<AdminInstitution[]>,
  updateUserDetails: (userId: string, data: Record<string, unknown>) => apiClient(`/users/${userId}/profile`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  listSubjects: () => apiClient('/subjects') as Promise<any[]>,
  listRooms: () => apiClient('/rooms') as Promise<any[]>,
  deleteUser: (userId: string) => apiClient(`/users/${userId}`, { method: 'DELETE' })
};
