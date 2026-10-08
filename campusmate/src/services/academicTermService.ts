import { apiClient } from './apiClient';

export type AcademicTerm = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

export const academicTermService = {
  getCurrent: () => apiClient('/academic-terms/current') as Promise<AcademicTerm>
};