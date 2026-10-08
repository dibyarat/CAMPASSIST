import { apiClient } from './apiClient';

export const studyResourceService = {
  list: (subjectId?: string) => {
    const url = subjectId ? `/studyos/academic?subjectId=${encodeURIComponent(subjectId)}` : '/studyos/academic';
    return apiClient(url) as Promise<any[]>;
  },
  create: (payload: Record<string, any>) => apiClient('/studyos/academic', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getDownloadUrl: (fileRef: string) => apiClient(`/studyos/academic/download/${encodeURIComponent(fileRef)}`)
};
