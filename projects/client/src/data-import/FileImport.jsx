import produce from 'immer';
import { useCallback } from 'react';
import { Route, Routes, useMatch } from 'react-router-dom';

import { Placeholder } from '@/components';
import { useFileImport } from '@/data-import/FileImport/api';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { projectRoutes } from '@/projects/routes';
import { URLS } from '@/urls';

import { ARIESImport } from './FileImport/ARIESImport';
import { CSVImport } from './FileImport/CSVImport';
import { FileImportModuleList } from './FileImport/FileImportMod';
import { PHDWINImport } from './FileImport/PHDWINImport';

export function FileImport() {
	const project = useCurrentProject();
	const matchUrl = project?.data
		? `${projectRoutes.project(':id').dataImport(':fileImportId').root}/*`
		: `${URLS.dataImports}/:fileImportId/*`;
	const {
		params: { fileImportId },
	} = useMatch(matchUrl);
	const { fileImport, isLoading, invalidateImport, updateImport } = useFileImport(fileImportId);

	const { importType } = fileImport || {};
	const sharedProps = fileImport;

	const importFileNotificationCallback = useCallback(
		async (notification) => {
			if (notification.extra?.body?.fileImportId === fileImportId) {
				const newStatus = notification.extra?.body?.status;

				if (newStatus) {
					updateImport(
						produce((draft) => {
							if (draft) {
								draft.status = newStatus;
							}
						})
					);
				}

				if (notification.status === TaskStatus.COMPLETED || notification.status === TaskStatus.FAILED) {
					invalidateImport();
				}
			}
		},
		[fileImportId, invalidateImport, updateImport]
	);
	useUserNotificationCallback(NotificationType.FILE_IMPORT, importFileNotificationCallback);

	return (
		<Placeholder loading={isLoading} loadingText='Loading File Import' main>
			{importType === 'aries' ? (
				<ARIESImport {...sharedProps} />
			) : importType === 'phdwin' ? (
				<PHDWINImport {...sharedProps} />
			) : (
				<CSVImport {...sharedProps} />
			)}
		</Placeholder>
	);
}

export const FileImports = () => (
	<Routes>
		<Route path='/' element={<FileImportModuleList />} />
		<Route path='/:fileImportId/*' element={<FileImport />} />
	</Routes>
);

export default FileImports;
