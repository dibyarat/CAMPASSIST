import { apiClient } from './apiClient';

export type Department = {
  id: string;
  name: string;
  code: string;
  sections?: { id: string }[];
};

export const departmentService = {
  list: () => apiClient('/departments') as Promise<Department[]>,
  create: (data: Pick<Department, 'name' | 'code'>) => apiClient('/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Pick<Department, 'name' | 'code'>>) => apiClient(`/departments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  remove: (id: string) => apiClient(`/departments/${id}`, { method: 'DELETE' }),
};