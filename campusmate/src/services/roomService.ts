import { apiClient } from './apiClient';

export type RoomStatus = 'FREE_BY_TIMETABLE' | 'OCCUPIED_BY_TIMETABLE' | 'REPORTED_FREE' | 'UNKNOWN_STALE' | 'MAINTENANCE';

export const roomService = {
	list: () => apiClient('/rooms'),
	available: () => apiClient('/rooms/available'),
	reportStatus: (roomId: string, status: RoomStatus, notes?: string) => apiClient(`/rooms/${roomId}/report`, {
		method: 'PATCH',
		body: JSON.stringify({ status, notes })
	})
};
