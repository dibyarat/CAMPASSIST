import { apiClient } from './apiClient';

export const notificationService = {
	list: (page = 1, limit = 20) => apiClient(`/notifications?page=${page}&limit=${limit}`),
	unreadCount: () => apiClient('/notifications/unread-count'),
	markRead: (id: string) => apiClient(`/notifications/${id}/read`, { method: 'PATCH' }),
	markAllRead: () => apiClient('/notifications/mark-all-read', { method: 'PATCH' }),
	createAnnouncement: (title: string, message: string) => apiClient('/notifications/announcement', {
		method: 'POST',
		body: JSON.stringify({ title, message })
	})
};
