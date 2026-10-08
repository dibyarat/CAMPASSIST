import { studyosService } from './studyosService';

export const documentService = {
	listAcademicResources: studyosService.listResources,
	getSecureDownloadUrl: studyosService.getDownloadUrl
};
