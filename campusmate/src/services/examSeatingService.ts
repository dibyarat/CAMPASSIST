import { apiClient } from './apiClient';

export const examSeatingService = {
  import: (examId: string, seatingData: any[]) => apiClient(`/exams/${examId}/seating-import`, {
    method: 'POST',
    body: JSON.stringify(seatingData)
  }),
  getMySeat: (examId: string) => apiClient(`/exams/${examId}/my-seat`) as Promise<any>
};
