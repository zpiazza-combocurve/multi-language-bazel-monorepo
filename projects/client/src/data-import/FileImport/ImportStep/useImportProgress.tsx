import produce from 'immer';
import { useCallback } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import * as api from '@/data-import/FileImport/api';
import { useAlfa } from '@/helpers/alfa';
import { postApi } from '@/helpers/routing';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { getProject } from '@/projects/api';
import { URLS } from '@/urls';

const NOT_STARTED = 'mapped';

export function useImportProgress(fileImportId) {
	const { set } = useAlfa();
	const { fileImport } = api.useFileImport(fileImportId);
	const navigate = useNavigate();
	const importFileNotificationCallback = useCallback(
		async (notification) => {
			if (
				notification.extra?.body?.fileImportId === fileImportId &&
				notification.status === TaskStatus.COMPLETED
			) {
				const project = await getProject(fileImport.project);
				set({ project });
				navigate(URLS.project(fileImport.project).dataImport(fileImportId).importStep, { replace: true });
			}
		},
		[fileImport.project, fileImportId, navigate, set]
	);
	useUserNotificationCallback(NotificationType.FILE_IMPORT, importFileNotificationCallback);
}

export function useStartImport(id, { projectName, selectedScenarios, selectedSetups, createElts, onlyForecast }) {
	const { user } = useAlfa();
	const track = useTrackAnalytics();
	const { updateImport, invalidateImport } = api.useFileImport(id);
	const { mutateAsync: createProject } = useMutation(() => postApi('/projects', { name: projectName }));
	const { mutateAsync: assignProject } = useMutation(({ _id }: { _id: string }) =>
		api.assignProject(id, {
			importType: 'aries',
			project: _id,
		})
	);
	const { mutateAsync: saveAriesSettings } = useMutation(() =>
		api.saveSetting(id, {
			scenarios: selectedScenarios,
			setups: selectedSetups,
			onlyForecast,
			createElts,
			user: user._id,
			importType: 'aries',
		})
	);
	const { mutateAsync: startImport } = useMutation(() =>
		api.startImport(id, {
			importMode: 'both',
		})
	);
	const { mutateAsync: handleStartImport, isLoading: starting } = useMutation(
		async () => {
			const newProject = await createProject();
			await assignProject(newProject);
			await saveAriesSettings();
			invalidateImport();

			track(EVENTS.dataImport.startAriesImport, { onlyImportForecast: onlyForecast, createELTs: createElts });
			await startImport();
		},
		{
			onError: async () => {
				updateImport(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					produce((draft: any) => {
						if (draft) {
							draft.status = NOT_STARTED;
						}
					})
				);
			},
		}
	);
	return { handleStartImport, starting };
}

export function useStartPhdwinImport(id, { projectName, selectedScenarios }) {
	const { user } = useAlfa();
	const { updateImport, invalidateImport } = api.useFileImport(id);
	const { mutateAsync: createProject } = useMutation(() => postApi('/projects', { name: projectName }));
	const { mutateAsync: assignProject } = useMutation(({ _id }: { _id: string }) =>
		api.assignProject(id, {
			importType: 'phdwin',
			project: _id,
		})
	);

	const { mutateAsync: savePhdwinSettings } = useMutation(() =>
		api.saveSetting(id, {
			user: user._id,
			scenarios: selectedScenarios,
			importType: 'phdwin',
		})
	);

	const { mutateAsync: startPhdwinImport } = useMutation(() =>
		api.startImport(id, {
			importMode: 'both',
		})
	);
	const { mutateAsync: handleStartPhdwinImport, isLoading: starting } = useMutation(
		async () => {
			const newProject = await createProject();
			await assignProject(newProject);
			await savePhdwinSettings();
			invalidateImport();
			await startPhdwinImport();
		},
		{
			onError: async () => {
				updateImport(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					produce((draft: any) => {
						if (draft) {
							draft.status = NOT_STARTED;
						}
					})
				);
			},
		}
	);
	return { handleStartPhdwinImport, starting };
}
