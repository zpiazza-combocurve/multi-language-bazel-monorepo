import { useQuery, useQueryClient } from 'react-query';

import { getApi, putApi } from '@/helpers/routing';

import { Notification, mapNotification } from './notification';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export function getNotifications() {
	return getApi('/notifications');
}

export function markAllNotificationsAsRead() {
	return putApi(`/notifications/read`);
}

export function toogleNotificationReadFlag(id) {
	return putApi(`/notifications/${id}/read`);
}

export function useNotifications() {
	const queryClient = useQueryClient();

	const { isLoading, data: notifications } = useQuery(NOTIFICATIONS_QUERY_KEY, async (): Promise<Notification[]> => {
		const serverNotifications = await getNotifications();
		return new Promise((resolve) => {
			resolve(serverNotifications.map((n) => mapNotification(n, false)));
		});
	});

	return { queryClient, isLoading, notifications };
}
