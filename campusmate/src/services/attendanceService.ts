import { apiClient } from './apiClient';

export const attendanceService = {
	getMyStats: () => apiClient('/attendance/my-attendance'),
	mark: (data: { subjectRef: string; date: string; state: 'PRESENT' | 'ABSENT' }) => apiClient('/attendance/mark', {
		method: 'POST',
		body: JSON.stringify(data)
	}),
	getMyDisputes: () => apiClient('/attendance/my-disputes'),
	submitDispute: (data: { subjectRef: string; sessionDate: string; reason: string }) => apiClient('/attendance/dispute', {
		method: 'POST',
		body: JSON.stringify(data)
	})
};
