import { apiClient } from './apiClient';

export type StudentOffer = {
	id: string;
	title: string;
	provider: string;
	discount: string;
	description?: string | null;
	expiresAt?: string | null;
	type: string;
	claimUrl?: string | null;
};

export const offerService = {
	list: () => apiClient('/offers') as Promise<StudentOffer[]>,
	create: (data: Omit<StudentOffer, 'id'>) => apiClient('/offers', { method: 'POST', body: JSON.stringify(data) }),
	claim: (id: string) => apiClient(`/offers/${id}/claim`, { method: 'POST' })
};
