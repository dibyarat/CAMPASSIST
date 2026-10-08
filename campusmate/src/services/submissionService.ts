import { apiClient } from './apiClient';

export const submissionService = {
	listMine: () => apiClient('/submissions/mine'),
	save: (data: Record<string, unknown>) => apiClient('/submissions', {
		method: 'POST',
		body: JSON.stringify(data)
	})
};
