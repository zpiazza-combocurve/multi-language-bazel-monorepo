import { useCallback, useState } from 'react';

import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';

const noop = () => null;

export function useFileImportProgress(fileImportId, cb = noop) {
	const [importing, setImporting] = useState(false);

	const importFileNotificationCallback = useCallback(
		(notification) => {
			if (
				notification.extra?.body?.fileImportId === fileImportId &&
				(notification.status === TaskStatus.COMPLETED || notification.status === TaskStatus.FAILED)
			) {
				setImporting(false);
				cb();
			}
		},
		[fileImportId, cb]
	);
	useUserNotificationCallback(NotificationType.FILE_IMPORT, importFileNotificationCallback);

	return {
		setImporting,
		importing,
	};
}
