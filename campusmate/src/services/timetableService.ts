import { apiClient } from './apiClient';

export const timetableService = {
  listForSection: (sectionId: string, termId: string) => apiClient(`/timetable/section/${encodeURIComponent(sectionId)}/term/${encodeURIComponent(termId)}`) as Promise<any[]>,
  listSubjects: () => apiClient('/timetable/subjects') as Promise<any[]>,
  create: (payload: Record<string, any>) => apiClient('/timetable', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  createForCr: (payload: Record<string, any>) => apiClient('/timetable/cr', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateForCr: (entryId: string, payload: Record<string, any>) => apiClient(`/timetable/${entryId}/cr-update`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),
  deleteForCr: (entryId: string) => apiClient(`/timetable/${entryId}/cr-delete`, { method: 'DELETE' })
};
