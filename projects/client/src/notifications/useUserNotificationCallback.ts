import { useEffect } from 'react';

import { useCallbackRef } from '@/components/hooks/useCallbackRef';
import { useAlfa } from '@/helpers/alfa';

import { USER_NOTIFICATION_UPDATE_EVENT_NAME } from './constants';
import { Notification, NotificationType, mapNotification, mergeWithExistingNotification } from './notification';
import { NOTIFICATIONS_QUERY_KEY, useNotifications } from './useNotifications';

/**
 * @example
 * 	import { NotificationType } from '@/notifications/notification';
 * 	import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
 *
 * 	useUserNotificationCallback(NotificationType.DIAGNOSTICS, (notification) => {
 * 		// handle notification resolution
 * 	});
 */
export const useUserNotificationCallback = (type: NotificationType, callback: (notification: Notification) => void) => {
	const { Pusher: userPusherChannel } = useAlfa(['Pusher']);
	const { queryClient } = useNotifications();

	const wrappedCallback = useCallbackRef(async (notificationUpdate) => {
		if (callback) {
			const existingNotification = queryClient
				.getQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY)
				?.find((n) => n.id === notificationUpdate._id);

			if (existingNotification) {
				if (existingNotification.type === type) {
					callback(mergeWithExistingNotification(notificationUpdate, { ...existingNotification }));
				}
			} else if (notificationUpdate.type === type) {
				callback(mapNotification(notificationUpdate));
			}
		}
	});

	useEffect(() => {
		userPusherChannel.bind(USER_NOTIFICATION_UPDATE_EVENT_NAME, wrappedCallback);

		return () => {
			userPusherChannel.unbind(USER_NOTIFICATION_UPDATE_EVENT_NAME, wrappedCallback);
		};
	}, [userPusherChannel, wrappedCallback]);

	return { queryClient };
};

interface UserNotificationCallbackProps {
	type: NotificationType;
	callback: (notification: Notification) => void;
}

export const UserNotificationCallback = ({ type, callback }: UserNotificationCallbackProps) => {
	useUserNotificationCallback(type, callback);
	return null;
};
