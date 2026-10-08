import { apiClient } from './apiClient';

export type AcademicGrade = {
  id: string;
  grade: string;
  credits: number;
  subject?: { name: string; code: string } | null;
};

export type AcademicRecord = {
  id: string;
  term?: { name: string } | null;
  grades: AcademicGrade[];
  totalCredits: number;
  sgpa: number | null;
  cgpa: number | null;
};

export const gradesService = {
  getMyRecords: () => apiClient('/grades/my-records') as Promise<AcademicRecord[]>,
};