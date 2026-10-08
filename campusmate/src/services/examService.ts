import { apiClient } from './apiClient';

export const examService = {
  listByTerm: (termId: string) => apiClient(`/exams/term/${encodeURIComponent(termId)}`) as Promise<any[]>,
  create: (payload: Record<string, any>) => apiClient('/exams', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  mySeat: (examId: string) => apiClient(`/exams/${examId}/my-seat`) as Promise<any>,
  importSeating: (examId: string, seatingData: any[]) => apiClient(`/exams/${examId}/seating-import`, {
    method: 'POST',
    body: JSON.stringify(seatingData)
  })
};
