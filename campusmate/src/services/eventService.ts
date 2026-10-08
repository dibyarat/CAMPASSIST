import { apiClient } from './apiClient';

export type CampusEvent = {
	id: string;
	title: string;
	description?: string | null;
	startDate: string;
	endDate?: string | null;
	location: string;
	organizer?: string | null;
	imageUrl?: string | null;
	tags?: string | null;
	_count?: { registrations: number };
};

export const eventService = {
	list: (includeAll = false) => apiClient(`/events${includeAll ? '?includeAll=true' : ''}`) as Promise<CampusEvent[]>,
	create: (data: Omit<CampusEvent, 'id' | '_count'>) => apiClient('/events', { method: 'POST', body: JSON.stringify(data) }),
	register: (id: string) => apiClient(`/events/${id}/register`, { method: 'POST' }),
	remove: (id: string) => apiClient(`/events/${id}`, { method: 'DELETE' })
};
