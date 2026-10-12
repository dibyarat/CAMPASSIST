import { apiClient } from './apiClient';

export type AcademicResource = {
	id: string;
	title: string;
	description?: string;
	type: string;
	subjectId?: string | null;
	fileReference: string;
	fileName?: string;
	fileSize?: number;
	uploaderId: string;
	createdAt: string;
	category?: string;
	experimentNo?: number;
	code?: string;
	isMine?: boolean;
	source?: 'studyos_resource' | 'studyos_lab' | 'studyos_class' | 'campassist_academic';
};

export type StudyOSOverview = {
	connected?: boolean;
	totalClasses?: number;
	myClasses?: number;
	totalResources?: number;
	myResources?: number;
	totalLabs?: number;
	myLabs?: number;
	stats?: {
		totalClasses: number;
		myClasses: number;
		totalResources: number;
		myResources: number;
		totalLabs: number;
		myLabs: number;
	};
	studyosUrl?: string;
};

export const studyosService = {
	getOverview: () => apiClient('/studyos/academic/overview') as Promise<StudyOSOverview>,
	listResources: (subjectId?: string) => apiClient(subjectId ? `/studyos/academic?subjectId=${encodeURIComponent(subjectId)}` : '/studyos/academic') as Promise<AcademicResource[]>,
	getDownloadUrl: (fileReference: string) => apiClient(`/studyos/academic/download/${encodeURIComponent(fileReference)}`) as Promise<{ url: string }>,
	createResource: (data: Omit<AcademicResource, 'id' | 'uploaderId' | 'createdAt'>) => apiClient('/studyos/academic', {
		method: 'POST',
		body: JSON.stringify(data)
	})
};

