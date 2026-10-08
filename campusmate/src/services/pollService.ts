import { apiClient } from './apiClient';

export const pollService = {
	listActive: () => apiClient('/polls'),
	vote: (pollId: string, optionId: string) => apiClient(`/polls/${pollId}/vote`, {
		method: 'POST',
		body: JSON.stringify({ optionId })
	}),
	create: (data: { title: string; description?: string; target: string; endDate?: string; options: string[] }) => apiClient('/polls', {
		method: 'POST',
		body: JSON.stringify(data)
	})
};
