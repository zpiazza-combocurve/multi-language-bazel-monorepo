import { faCodeMerge } from '@fortawesome/pro-light-svg-icons';
import { faArchive, faFileImport } from '@fortawesome/pro-regular-svg-icons';
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { useAbilityRules } from '@/access-policies/AbilityProvider';
import { ACTIONS, Can, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { usePermissionsBuilder } from '@/access-policies/usePermissions';
import { getTaggingProp } from '@/analytics/tagging';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, alerts } from '@/components/v2';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { ModuleNavigationQuery } from '@/helpers/Navigation';
import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { deleteApi, getApi, postApi } from '@/helpers/routing';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult } from '@/module-list/types';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { PROJECT_KEYS, getProject } from '@/projects/api';
import { URLS } from '@/urls';

import { ArchivingModuleList } from './ArchivingModuleList';
import NewProjectDialog from './NewProjectDialog';

const ANALYTICS_TAGGING = {
	copy: 'project',
};

const IMPORT_PROJECT_MODES = {
	standard: { value: 'standard', label: 'Standard' },
	advanced: { value: 'advanced', label: 'Advanced' },
};

const IMPORT_PROJECT_MODES_ARRAY = Object.values(IMPORT_PROJECT_MODES);

type ProjectItem = Pick<Inpt.Project, '_id' | 'name' | 'createdAt'> & {
	createdBy: Inpt.User;
	wellsLength: number;
	scenariosLength: number;
};

const ImportProjectFromCodeDialog = ({
	visible,
	onHide,
	resolve,
}: DialogProps<{ code: string; name: string; mode: string }>) => {
	const [code, setCode] = useState<string | null>(null);
	const [name, setName] = useState<string | null>(null);
	const [mode, setMode] = useState(IMPORT_PROJECT_MODES.standard.value);

	const { isCustomStreamsEnabled } = useLDFeatureFlags();

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='xs'>
			<DialogTitle>Import project</DialogTitle>
			<DialogContent>
				<TextField
					css='margin-bottom: 2rem;'
					variant='outlined'
					label='Code'
					onChange={(ev) => setCode(ev.target.value)}
					placeholder='Project code'
					fullWidth
				/>
				<TextField
					variant='outlined'
					label='Name'
					onChange={(ev) => setName(ev.target.value)}
					placeholder='Name for the imported project'
					fullWidth
				/>
				{isCustomStreamsEnabled && (
					<div css='margin-top: 1.5rem;'>
						<Typography>Mode</Typography>
						<RadioGroupField
							css='margin-left: 1rem; margin-top: 0.75rem;'
							value={mode}
							onChange={(ev) => setMode(ev.target.value)}
							options={IMPORT_PROJECT_MODES_ARRAY}
						/>
					</div>
				)}
			</DialogContent>
			<DialogActions css='padding: 1.5rem;'>
				<Button color='secondary' onClick={onHide}>
					Cancel
				</Button>
				<Button
					color='secondary'
					variant='contained'
					disabled={!code || !name}
					onClick={() => code && name && resolve({ code, name, mode })}
					{...getTaggingProp('project', 'import')}
				>
					Import
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const ImportProjectButton = ({ refresh }) => {
	const [importProjectFromCodeDialog, confirmImportProjectFromCodeDialog] = useDialog(ImportProjectFromCodeDialog);
	const { invalidateRules } = useAbilityRules();

	const importProjectNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				refresh();
				invalidateRules();
			}
		},
		[refresh, invalidateRules]
	);
	useUserNotificationCallback(NotificationType.IMPORT_PROJECT, importProjectNotificationCallback);

	const importOnClick = async () => {
		const results = await confirmImportProjectFromCodeDialog();

		if (!results) {
			return;
		}

		// mode will be used later
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { code, name, mode } = results;

		// sometimes the code can have tabs/spaces when copying / pasting from the shareable codes table
		const trimmedCode = code.trim();

		try {
			await postApi('/projects/import-from-code', { code: trimmedCode, name });
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	return (
		<>
			{importProjectFromCodeDialog}
			<Can do={ACTIONS.Create} on={subject(SUBJECTS.Projects, { _id: null })} passThrough>
				{(allowed) => (
					<Button
						size='small'
						color='secondary'
						disabled={!allowed && PERMISSIONS_TOOLTIP_MESSAGE}
						onClick={importOnClick}
						startIcon={faFileImport}
					>
						Import
					</Button>
				)}
			</Can>
		</>
	);
};

const MergeProjectsButton = ({ canCreate, selectedProjectsSet }) => {
	const navigate = useNavigate();
	const enabled = selectedProjectsSet?.size === 2;
	const tooltip = canCreate ? 'Select 2 projects to merge them' : PERMISSIONS_TOOLTIP_MESSAGE;
	const selectedProjects = enabled ? [...selectedProjectsSet] : [];
	const firstProjectId = enabled ? selectedProjects[0] : '';
	const secondProjectId = enabled ? selectedProjects[1] : '';

	return (
		<Button
			tooltipTitle={tooltip}
			disabled={!enabled}
			startIcon={faCodeMerge}
			onClick={() => {
				navigate(URLS.mergeProjects(firstProjectId, secondProjectId));
			}}
		>
			Merge
		</Button>
	);
};

function useArchiveProject() {
	const onArchive = async (project) => {
		const { _id: projectId, name: projectNameToArchive } = project;
		if (
			!(await alerts.confirm({
				title: `Do you want to archive this project?`,
				children: <Typography>{projectNameToArchive}</Typography>,
				confirmText: 'Archive',
				confirmButtonProps: {
					...getTaggingProp('project', 'archive'),
				},
			}))
		) {
			return;
		}

		try {
			await postApi(`/archive/archive/${projectId}`, {
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			});
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const { canCreate: canCreateArchive } = usePermissionsBuilder(SUBJECTS.ArchivedProjects);
	const canArchive = (project) => canCreateArchive({ projectId: project?._id } as Inpt.ArchivedProject);

	return {
		canArchive,
		onArchive,
	};
}

function RealProjectModuleList() {
	const navigate = useNavigate();

	const { invalidateRules } = useAbilityRules();

	const [newProjectDialog, showCreateProjectDialog] = useDialog(NewProjectDialog);

	const { canArchive, onArchive } = useArchiveProject();

	const { project, set } = useAlfa();

	const queryClient = useQueryClient();

	const refreshCurrentProject = async () => {
		if (project?._id != null) {
			const key = PROJECT_KEYS.getProject(project._id);
			const newProject = await queryClient.fetchQuery(key, () => getProject(project._id));
			queryClient.setQueryData(key, newProject);
			set({ project: newProject });
		}
	};

	const feat = 'Project';

	const {
		canCreate: canCreateProject,
		canUpdate: canUpdateProject,
		canDelete: canDeleteProject,
	} = usePermissionsBuilder(SUBJECTS.Projects);
	const canCreateProjects = canCreateProject({ _id: null });

	const { selection, runFilters, moduleListProps } = useModuleListRef({
		createdBy: '',
		dateMax: null,
		dateMin: null,
		search: '',
		sort: 'createdAt',
		sortDir: -1,
		tags: [],
		wellsMax: '',
		wellsMin: '',
	});

	const copyProjectNotificationCallback = useCallback(
		async (notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				invalidateRules();
			}
		},
		[invalidateRules]
	);
	useUserNotificationCallback(NotificationType.COPY_PROJECT, copyProjectNotificationCallback);

	const restoreProjectNotificationCallback = useCallback(
		async (notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				runFilters?.();
			}
		},
		[runFilters]
	);

	useUserNotificationCallback(NotificationType.RESTORE_PROJECT, restoreProjectNotificationCallback);

	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	return (
		<>
			{newProjectDialog}
			<ModuleList
				{...moduleListProps}
				feat={feat}
				fetch={(body) => getApi('/projects', _.pickBy(body)) as Promise<FilterResult<ProjectItem>>}
				workMe={async (projectItem: ProjectItem) => {
					navigate(URLS.project(projectItem._id).root);
				}}
				useSelection
				useTags='project'
				analyticsTagging={ANALYTICS_TAGGING}
				onTagsChange={refreshCurrentProject}
				onCreate={async () => {
					const created = await showCreateProjectDialog();
					if (created) {
						invalidateRules();
					}
				}}
				canCreate={canCreateProjects}
				globalActions={<ImportProjectButton refresh={() => runFilters()} />}
				filters={
					<>
						<Filters.Title />
						<Filters.NameFilter />
						<Filters.CreatedRangeFilter />
						<Filters.CreatedByFilter />
						<Filters.WellsRangeFilter />
						<Filters.TagsFilter />
					</>
				}
				itemDetails={useMemo(
					() => [
						{
							...Fields.name,
							canRename: canUpdateProject,
							onRename: (value, item) => postApi(`/projects/${item._id}/changeName`, { name: value }),
						},
						Fields.createdBy,
						Fields.createdAt,
						Fields.wells,
						...(isWellsCollectionsEnabled ? [Fields.wellCollections] : []),
						Fields.scenarios,
						Fields.forecasts,
						Fields.typeCurves,
						Fields.schedules,
						Fields.scenarioLookupTables,
						Fields.typeCurveLookupTables,
						Fields.embeddedLookupTables,
						Fields.tags,
					],
					[canUpdateProject, isWellsCollectionsEnabled]
				)}
				copyNotification={NotificationType.COPY_PROJECT}
				onCopy={({ _id: projectId }, options) => postApi(`/projects/${projectId}/copy`, options)}
				canCopy={() => canCreateProjects}
				additionalCopyDialogParagraphs={useMemo(() => ['Files related to economics will not be copied.'], [])}
				onDelete={async (item) => {
					await deleteApi(`/projects/${item._id}`);

					if (item._id === project?._id) {
						set({ project: undefined });
					}
				}}
				canDelete={canDeleteProject}
				requireNameToDelete
				itemActions={(item) => [
					{
						icon: faArchive,
						label: 'Archive',
						disabled: !canArchive(item) && PERMISSIONS_TOOLTIP_MESSAGE,
						onClick: () => onArchive(item),
					},
				]}
				selectionActions={
					<MergeProjectsButton selectedProjectsSet={selection?.selectedSet} canCreate={canCreateProjects} />
				}
				currentItem={project}
			/>
		</>
	);
}

export function ProjectModuleList() {
	return (
		<ModuleNavigationQuery
			default='projects'
			pages={[
				{ component: RealProjectModuleList, path: 'projects', label: 'Projects' },
				{ component: ArchivingModuleList, path: 'archives', label: 'Archives' },
			]}
		/>
	);
}

export default ProjectModuleList;
