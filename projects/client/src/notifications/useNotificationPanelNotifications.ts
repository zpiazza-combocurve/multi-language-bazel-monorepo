import { compareDesc, isSameDay, subDays } from 'date-fns';
import { useCallback, useEffect } from 'react';

import { useAlfa } from '@/helpers/alfa';
import { isBrowserTabActive } from '@/helpers/document';
import { usePrevious } from '@/helpers/hooks';

import { COMPANY_NOTIFICATION_UPDATE_EVENT_NAME, USER_NOTIFICATION_UPDATE_EVENT_NAME } from './constants';
import Notification, { TaskStatus, mapNotification, mergeWithExistingNotification } from './notification';
import { useGlobalNotificationsCallbacks } from './useGlobalNotificationsCallbacks';
import { NOTIFICATIONS_WITH_EXPORT, useNotificationDownloadActions } from './useNotificationDownloadActions';
import {
	NOTIFICATIONS_QUERY_KEY,
	markAllNotificationsAsRead,
	toogleNotificationReadFlag,
	useNotifications,
} from './useNotifications';

const sortNotificationsByStatus = (notifications: Notification[]): Notification[] => {
	const sortedByDate: Notification[] = [...notifications].sort((a, b) =>
		compareDesc(a.updatedAt || a.createdAt, b.updatedAt || b.createdAt)
	);

	return sortedByDate
		.filter((n) => n.status === TaskStatus.QUEUED)
		.concat(sortedByDate.filter((n) => n.status === TaskStatus.RUNNING))
		.concat(sortedByDate.filter((n) => n.status !== TaskStatus.QUEUED && n.status !== TaskStatus.RUNNING));
};

export function useNotificationPanelNotifications(panelOpened: boolean) {
	const { queryClient, isLoading, notifications } = useNotifications();
	const { Pusher: userPusherChannel, CompanyPusher: companyPusherChannel } = useAlfa(['Pusher', 'CompanyPusher']);
	const { downloadForecastExportDialog, downloadIfExists } = useNotificationDownloadActions();

	useGlobalNotificationsCallbacks();

	const onMarkAllNotificationsAsRead = useCallback(async () => {
		await markAllNotificationsAsRead();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (oldNotifications: any): Notification[] => {
			if (oldNotifications) {
				const newNotifications: Notification[] = [...oldNotifications];

				newNotifications.forEach((n) => {
					n.read = true;
				});

				return newNotifications;
			}

			return oldNotifications;
		});
	}, [queryClient]);

	const onToggleNotificationReadFlag = useCallback(
		async (id) => {
			await toogleNotificationReadFlag(id);

			queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (oldNotifications?: Notification[]): Notification[] => {
				if (oldNotifications) {
					const newNotifications: Notification[] = [...oldNotifications];

					for (let i = 0; i < newNotifications.length; ++i) {
						const notification = newNotifications[i];

						if (notification.id === id) {
							notification.read = !notification.read;
						}
					}

					return newNotifications;
				}

				return oldNotifications ?? [];
			});
		},
		[queryClient]
	);

	const onNotificationReceived = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(serverNotification: any) => {
			if (serverNotification._id) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (oldNotifications: any): Notification[] => {
					if (oldNotifications) {
						const newNotifications: Notification[] = [...oldNotifications];

						const existingNotification: Notification | undefined = newNotifications.find(
							(n) => n.id === serverNotification._id
						);

						let upsertedNotification: Notification;

						if (existingNotification) {
							upsertedNotification = mergeWithExistingNotification(
								serverNotification,
								existingNotification
							);
						} else {
							upsertedNotification = mapNotification(serverNotification, !panelOpened);
							newNotifications.push(upsertedNotification);
						}

						if (
							serverNotification.status === TaskStatus.COMPLETED &&
							isBrowserTabActive() &&
							NOTIFICATIONS_WITH_EXPORT.indexOf(upsertedNotification.type) > -1
						) {
							downloadIfExists(upsertedNotification.type, upsertedNotification.extra);
						}

						return newNotifications;
					}

					return oldNotifications;
				});
			}
		},
		[queryClient, panelOpened, downloadIfExists]
	);

	const onNotificationReceivedPrevious = usePrevious(onNotificationReceived);

	const onHideDynamic = useCallback(
		(notificationId: string | undefined = undefined, close = true) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (oldNotifications: any): Notification[] => {
				const newNotifications: Notification[] = [...oldNotifications];

				const propToUpdate = close ? 'dynamic' : 'hidden';
				const value = !close;

				if (notificationId) {
					const notification: Notification | undefined = newNotifications.find(
						(n) => n.id === notificationId
					);

					if (notification) {
						notification[propToUpdate] = value;
					}
				} else {
					newNotifications.forEach((n) => {
						n[propToUpdate] = value;
					});
				}

				return newNotifications;
			});
		},
		[queryClient]
	);

	useEffect(() => {
		if (userPusherChannel) {
			if (onNotificationReceivedPrevious) {
				userPusherChannel.unbind(USER_NOTIFICATION_UPDATE_EVENT_NAME, onNotificationReceivedPrevious);
			}

			userPusherChannel.bind(USER_NOTIFICATION_UPDATE_EVENT_NAME, onNotificationReceived);
		}
	}, [userPusherChannel, onNotificationReceived, onNotificationReceivedPrevious]);

	useEffect(() => {
		if (companyPusherChannel) {
			if (onNotificationReceivedPrevious) {
				companyPusherChannel.unbind(COMPANY_NOTIFICATION_UPDATE_EVENT_NAME, onNotificationReceivedPrevious);
			}

			companyPusherChannel.bind(COMPANY_NOTIFICATION_UPDATE_EVENT_NAME, onNotificationReceived);
		}
	}, [companyPusherChannel, onNotificationReceived, onNotificationReceivedPrevious]);

	const now = new Date();
	const yesterday = subDays(now, 1);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const sortedNotifications = sortNotificationsByStatus((notifications || []) as any[]);
	const todayNotifications = sortedNotifications.filter((n) => isSameDay(n.updatedAt || n.createdAt, now));
	const yesterdayNotifications = sortedNotifications.filter((n) => isSameDay(n.updatedAt || n.createdAt, yesterday));

	const todayAndYesterdayNotificationIds = todayNotifications
		.map((n) => n.id)
		.concat(yesterdayNotifications.map((n) => n.id));

	const earlierNotifications = sortedNotifications.filter((n) => todayAndYesterdayNotificationIds.indexOf(n.id) < 0);
	const dynamicNotifications = sortedNotifications.filter((n) => n.dynamic);

	return {
		notifications: sortedNotifications,
		todayNotifications,
		yesterdayNotifications,
		earlierNotifications,
		dynamicNotifications,
		isLoading,
		onMarkAllNotificationsAsRead,
		onToggleNotificationReadFlag,
		onHideDynamic,
		downloadForecastExportDialog,
		downloadIfExists,
	};
}
