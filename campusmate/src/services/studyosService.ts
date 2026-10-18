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
	mimeType?: string;
	uploaderId: string;
	createdAt: string;
	category?: string;
	displayCategory?: string;
	experimentNo?: number;
	code?: string;
	isMine?: boolean;
	source?: string;
	studyosUrl?: string;
};

export type StudyOSOverview = {
	connected?: boolean;
	totalClasses?: number;
	myClasses?: number;
	totalResources?: number;
	myResources?: number;
	totalLabs?: number;
	myLabs?: number;
	openTeams?: number;
	myTeams?: number;
	totalTeams?: number;
	helpServices?: number;
	myHelpServices?: number;
	totalHelpServices?: number;
	stats?: {
		totalClasses: number;
		myClasses: number;
		totalResources: number;
		myResources: number;
		totalLabs: number;
		myLabs: number;
		openTeams?: number;
		myTeams?: number;
		totalTeams?: number;
		helpServices?: number;
		myHelpServices?: number;
		totalHelpServices?: number;
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
	}),
	deleteResource: (id: string) => apiClient(`/studyos/academic/${encodeURIComponent(id)}`, {
		method: 'DELETE'
	}) as Promise<{ success: boolean; id: string; deleted: boolean }>
};

