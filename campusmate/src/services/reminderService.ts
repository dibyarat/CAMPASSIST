import { apiClient } from './apiClient';

export type Reminder = {
	id: string;
	title: string;
	description?: string | null;
	category: string;
	priority: string;
	dueDate: string;
	createdAt: string;
};

export const reminderService = {
	listMine: () => apiClient('/reminders/mine') as Promise<Reminder[]>,
	listRelevant: () => apiClient('/reminders/relevant') as Promise<Reminder[]>,
	create: (data: { title: string; dueDate: string; description?: string }) => apiClient('/reminders', {
		method: 'POST',
		body: JSON.stringify({ ...data, category: 'OTHER', priority: 'NORMAL', schedule: 'CUSTOM' })
	}),
	createForSection: (data: { title: string; dueDate: string; description?: string }) => apiClient('/reminders/section', {
		method: 'POST',
		body: JSON.stringify({ ...data, category: 'OTHER', priority: 'NORMAL', schedule: 'CUSTOM' })
	}),
	remove: (id: string) => apiClient(`/reminders/${id}`, { method: 'DELETE' })
};
