import { apiClient } from './apiClient';

export type ActivePoll = {
	id: string;
	title: string;
	description?: string | null;
	target: string;
	status: string;
	createdAt: string;
	endDate?: string | null;
	hasVoted: boolean;
	options: { id: string; text: string; _count?: { votes?: number } }[];
};

export const pollService = {
	listActive: () => apiClient('/polls') as Promise<ActivePoll[]>,
	vote: (pollId: string, optionId: string) => apiClient(`/polls/${pollId}/vote`, {
		method: 'POST',
		body: JSON.stringify({ optionId })
	}),
	create: (data: { title: string; description?: string; target: string; endDate?: string; options: string[] }) => apiClient('/polls', {
		method: 'POST',
		body: JSON.stringify(data)
	})
};
