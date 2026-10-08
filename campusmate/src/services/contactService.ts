import { apiClient } from './apiClient';

export type Contact = {
	id: string;
	email: string;
	profile?: {
		fullName?: string;
		section?: string | null;
		rollNumber?: string | null;
	} | null;
};

export const contactService = {
	listClassRepresentatives: () => apiClient('/users/cr') as Promise<Contact[]>
};
