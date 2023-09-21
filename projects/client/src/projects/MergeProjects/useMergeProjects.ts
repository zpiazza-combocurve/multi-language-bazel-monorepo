import produce from 'immer';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IDENTIFIERS } from '@/components/misc/WellIdentifierSelect';
import { genericErrorAlert } from '@/helpers/alerts';
import theme from '@/helpers/styled';
import { ModuleBasicInfo } from '@/module-list/Merge/models';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { URLS } from '@/urls';

import { mergeProjects } from '../api';
import { DUPLICATE_NAME_PARTS } from './constants';
import { MergeProjectsModel, MergedProjectCustomHeaderModel } from './models';

const useMergeProjects = (firstProjectId: string, secondProjectId: string) => {
	const [name, setName] = useState<string>('');
	const [duplicateNamePart, setDuplicateNamePart] = useState<string>(DUPLICATE_NAME_PARTS[0].value);
	const [duplicateNameModifier, setDuplicateNameModifier] = useState<string>('(1)');
	const [wellIdentifier, setWellIdentifier] = useState<string>(IDENTIFIERS[0].value);
	const [projects, setProjects] = useState<string[]>([firstProjectId, secondProjectId]);
	const [customHeaders, setCustomHeaders] = useState<MergedProjectCustomHeaderModel[]>([]);
	const navigate = useNavigate();
	const [isMergeInProgress, setIsMergeInProgress] = useState<boolean>(false);

	const sortProjects = useCallback((sorted: ModuleBasicInfo[]) => {
		setProjects(sorted.map((p) => p.id));
	}, []);

	const addCustomHeaders = useCallback((headersToAdd: MergedProjectCustomHeaderModel[]) => {
		setCustomHeaders(
			produce((draft: MergedProjectCustomHeaderModel[]) => {
				headersToAdd.forEach((h) => {
					h.color = h.headers.length > 1 ? theme.primaryColorRGB : theme.secondaryColorRGB;
					draft.push(h);
				});
			})
		);
	}, []);

	const updateCustomHeader = useCallback((updatedHeader: MergedProjectCustomHeaderModel) => {
		setCustomHeaders(
			produce((draft: MergedProjectCustomHeaderModel[]) => {
				for (let i = 0; i < draft.length; ++i) {
					if (draft[i].key === updatedHeader.key) {
						draft[i] = {
							...updatedHeader,
							color: updatedHeader.headers.length > 1 ? theme.primaryColorRGB : theme.secondaryColorRGB,
						};

						break;
					}
				}
			})
		);
	}, []);

	const deleteCustomHeader = useCallback(
		(key: string) => {
			setCustomHeaders(key ? customHeaders.filter((h) => h.key !== key) : []);
		},
		[customHeaders]
	);

	const model = useMemo<MergeProjectsModel>(() => {
		return {
			name,
			duplicateNamePart,
			duplicateNameModifier,
			wellIdentifier,
			projects,
			customHeaders,
		};
	}, [name, duplicateNamePart, duplicateNameModifier, wellIdentifier, projects, customHeaders]);

	const mergeProjectsNotificationCallback = useCallback(
		(notification) => {
			const projects = notification.extra?.body?.projects;

			if (
				projects?.length > 1 &&
				((projects[0] === firstProjectId && projects[1] === secondProjectId) ||
					(projects[1] === firstProjectId && projects[0] === secondProjectId))
			) {
				if (notification.status === TaskStatus.COMPLETED) {
					navigate(URLS.projects);
				} else if (notification.status === TaskStatus.FAILED) {
					setIsMergeInProgress(false);
				}
			}
		},
		[firstProjectId, navigate, secondProjectId]
	);
	useUserNotificationCallback(NotificationType.MERGE_PROJECTS, mergeProjectsNotificationCallback);

	const mergeChosenProjects = useCallback(async () => {
		setIsMergeInProgress(true);

		const body = {
			name: model.name,
			duplicateNamePart: model.duplicateNamePart,
			duplicateNameModifier: model.duplicateNameModifier,
			wellIdentifier: model.wellIdentifier,
			projects: model.projects,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			customHeaders: [] as any[],
		};

		model.customHeaders.forEach((h, i) => {
			body.customHeaders.push({
				name: h.name,
				headers: [],
			});

			h.headers.forEach((hh) => {
				body.customHeaders[i].headers.push({
					originalKey: hh.originalKey,
					prior: hh.prior,
					projectId: hh.projectId,
				});
			});
		});

		try {
			await mergeProjects(body);
		} catch (error) {
			genericErrorAlert(error);
			setIsMergeInProgress(false);
		}
	}, [model]);

	return {
		setName,
		setDuplicateNamePart,
		setDuplicateNameModifier,
		setWellIdentifier,
		sortProjects,
		model,
		addCustomHeaders,
		updateCustomHeader,
		deleteCustomHeader,
		mergeProjects: mergeChosenProjects,
		isMergeInProgress,
	};
};

export default useMergeProjects;
