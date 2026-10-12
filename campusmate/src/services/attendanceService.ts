import { apiClient } from './apiClient';

export interface RegisterComponent {
  key: string;
  base: { p: number; a: number };
}

export interface RegisterSubject {
  id: string;
  name: string;
  code?: string;
  components: RegisterComponent[];
  createdAt: string;
}

export interface RegisterLog {
  id: string;
  sid: string;
  comp: string;
  status: 'p' | 'a' | 'c';
  date: string; // YYYY-MM-DD
  at: string; // ISO
}

export interface AttendanceRegisterStore {
  target: number;
  subjects: RegisterSubject[];
  logs: RegisterLog[];
}

export const attendanceService = {
  getRegister: (): Promise<AttendanceRegisterStore> => apiClient('/attendance/register'),
  saveRegister: (data: AttendanceRegisterStore): Promise<AttendanceRegisterStore> =>
    apiClient('/attendance/register', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getMyStats: () => apiClient('/attendance/my-attendance'),
  mark: (data: { subjectRef: string; date: string; state: 'PRESENT' | 'ABSENT' }) =>
    apiClient('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMyDisputes: () => apiClient('/attendance/my-disputes'),
  submitDispute: (data: { subjectRef: string; sessionDate: string; reason: string }) =>
    apiClient('/attendance/dispute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

