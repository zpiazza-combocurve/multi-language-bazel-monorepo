import _ from 'lodash';
import { useCallback } from 'react';

import { useAbilityRules } from '@/access-policies/AbilityProvider';
import { useAlfa } from '@/helpers/alfa';
import { queryClient } from '@/helpers/query-cache';
import { getApi } from '@/helpers/routing';
import { getVersionedKey, local } from '@/helpers/storage';
import { projectHeadersStorage } from '@/manage-wells/WellsPage/TableView/CollectionTable/shared';
import { PROJECT_KEYS } from '@/projects/api';

import { Notification, NotificationType, TaskStatus } from './notification';
import { useUserNotificationCallback } from './useUserNotificationCallback';

export const useGlobalNotificationsCallbacks = () => {
	const { project, set } = useAlfa();

	const updateProjectWellsNotificationCallback = useCallback(
		async (notification: Notification) => {
			if (
				project &&
				notification.status === TaskStatus.COMPLETED &&
				(notification.extra?.body?.projectId === project._id ||
					notification.extra?.body?.targetProjectId === project._id ||
					notification.type === NotificationType.FILE_IMPORT)
			) {
				const wellIds = await getApi(`/projects/getProjectWellIds/${project._id}`);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				set({ project: { ...project, wells: wellIds } as any });

				// Invalidate current project query
				queryClient.invalidateQueries(PROJECT_KEYS.getProject(project._id));
			}
		},
		[project, set]
	);

	useUserNotificationCallback(NotificationType.IMPORT_FORECAST, updateProjectWellsNotificationCallback);
	useUserNotificationCallback(NotificationType.IMPORT_TYPE_CURVE, updateProjectWellsNotificationCallback);
	useUserNotificationCallback(NotificationType.IMPORT_SCENARIO, updateProjectWellsNotificationCallback);
	useUserNotificationCallback(NotificationType.FILE_IMPORT, updateProjectWellsNotificationCallback);

	const { invalidateRules } = useAbilityRules();

	const invalidateAbilityRulesNotificationCallback = useCallback(
		async (notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				invalidateRules();
			}
		},
		[invalidateRules]
	);

	useUserNotificationCallback(NotificationType.RESTORE_PROJECT, invalidateAbilityRulesNotificationCallback);
	useUserNotificationCallback(NotificationType.FILE_IMPORT, invalidateAbilityRulesNotificationCallback);

	const createWellsNotificationCallback = useCallback(
		async (notification: Notification) => {
			if (
				project &&
				notification.status === TaskStatus.COMPLETED &&
				notification.extra?.body?.projectId === project._id
			) {
				if (
					notification.status === TaskStatus.COMPLETED &&
					notification.extra?.body?.projectId === project._id
				) {
					const headersKey = getVersionedKey(
						projectHeadersStorage.getKey(project._id),
						projectHeadersStorage.version
					);

					const currentHeaders = local.getItem(headersKey) ?? [];
					local.setItem(headersKey, _.uniq([...currentHeaders, ...notification.extra.body.headers]));

					await updateProjectWellsNotificationCallback(notification);
				}
			}
		},
		[project, updateProjectWellsNotificationCallback]
	);

	useUserNotificationCallback(NotificationType.CREATE_WELLS, createWellsNotificationCallback);
};
