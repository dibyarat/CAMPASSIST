import { apiClient } from './apiClient';

export type AcademicResource = {
	id: string;
	title: string;
	type: string;
	subjectId?: string | null;
	fileReference: string;
	uploaderId: string;
	createdAt: string;
};

export const studyosService = {
	listResources: (subjectId?: string) => apiClient(subjectId ? `/studyos/academic?subjectId=${encodeURIComponent(subjectId)}` : '/studyos/academic') as Promise<AcademicResource[]>,
	getDownloadUrl: (fileReference: string) => apiClient(`/studyos/academic/download/${encodeURIComponent(fileReference)}`) as Promise<{ url: string }>,
	createResource: (data: Omit<AcademicResource, 'id' | 'uploaderId' | 'createdAt'>) => apiClient('/studyos/academic', {
		method: 'POST',
		body: JSON.stringify(data)
	})
};
