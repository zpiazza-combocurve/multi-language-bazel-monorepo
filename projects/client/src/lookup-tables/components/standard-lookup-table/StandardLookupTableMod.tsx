import { faFileImport } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import React, { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { Button } from '@/components/v2';
import { confirmationAlert, genericErrorAlert, warningAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { pluralize } from '@/helpers/text';
import { saveLookupTable as saveScenarioLookupTable } from '@/lookup-tables/scenario-lookup-table/api';
import { saveLookupTable as saveTypeCurveLookupTable } from '@/lookup-tables/type-curve-lookup-table/api';
import { MassDeleteButton } from '@/module-list/ModuleList/components';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult } from '@/module-list/types';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';

const MAX_COPYABLE_MODELS = 1000;

// use global definition
interface LookupTableItem {
	_id: string;
	name: string;
	createdBy: Inpt.User;
	createdAt: string;
	project: Inpt.Project;
}

export default function StandardLookupTableMod({
	featureName,
	getLookupTablesItems,
	deleteLookupTable,
	copyLookupTable,
	importLookupTable,
	massDeleteLookupTables,
	massImportLookupTables,
	copyNotification,
	importNotification,
	getRoutes,
	createDialog: CreateScenarioLookupTableDialog,
	canCreateLookupTable,
	canImportLookupTable,
}: {
	featureName: 'Scenario Lookup Tables' | 'Type Curve Lookup Tables' | 'Scheduling Lookup Tables';
	getLookupTablesItems: (body) => Promise<FilterResult<LookupTableItem>>;
	deleteLookupTable: (id: string) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	copyLookupTable: (id: string, params) => Promise<Record<string, any>>;
	importLookupTable: (params) => void;
	massDeleteLookupTables: (ids: string[]) => Promise<number>;
	massImportLookupTables: (body: { ids: string[]; project: string }) => void;
	copyNotification: NotificationType;
	importNotification: NotificationType;
	getRoutes: (projectId: string, id: string) => { edit; settings };
	createDialog: React.ElementType<DialogProps<{ project; _id }>>;
	canCreateLookupTable: boolean;
	canImportLookupTable: boolean;
}) {
	const { project } = useAlfa();

	const onCopy = async ({ _id: lookupId, project: { _id: projectId = '' } = {} }) => {
		await copyLookupTable(lookupId, {
			project: projectId,
		});
	};

	const navigate = useNavigate();

	const { runFilters, selection, moduleListProps } = useModuleListRef({
		createdBy: '',
		dateMax: '',
		dateMin: '',
		project: project?.name ?? '',
		projectExactMatch: !!project?.name,
		selectedProject: project,
		search: '',
		sort: 'createdAt',
		sortDir: -1,
		tags: [],
	});

	const importLookupTableNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.project === project?._id) {
				runFilters();
			}
		},
		[runFilters, project]
	);
	useUserNotificationCallback(importNotification, importLookupTableNotificationCallback);

	const ability = useContext(AbilityContext);

	const caslSubject =
		featureName === 'Scenario Lookup Tables' ? SUBJECTS.LookupTables : SUBJECTS.ForecastLookupTables;

	const [createDialog, showCreateDialog] = useDialog(CreateScenarioLookupTableDialog);

	const handleMassImport = async (ids: string[]) => {
		if (!project) {
			// TODO show warning or something, but this check should appear before calling this function
			return;
		}

		const modelsCount = ids.length;

		if (modelsCount > MAX_COPYABLE_MODELS) {
			warningAlert(
				`You are trying to import ${modelsCount} lookup tables. Cannot import over ${MAX_COPYABLE_MODELS} lookup tables. Use the filters to lower the number of models imported.`,
				2000
			);
			return;
		}

		try {
			await massImportLookupTables({
				ids,
				project: project?._id,
			});
		} catch (err) {
			genericErrorAlert(err, 'Failed to start import');
		}
	};

	const useTagsFeatureName = {
		'Scenario Lookup Tables': 'scenarioLookupTable',
		'Scheduling Lookup Tables': 'scheduleLookupTable',
		'Type Curve Lookup Tables': 'forecastLookupTable',
	}[featureName];

	return (
		<>
			{createDialog}
			<ModuleList
				{...moduleListProps}
				feat={featureName}
				fetch={(body) => getLookupTablesItems(_.pickBy(body))}
				useTags={useTagsFeatureName}
				onCreate={async () => {
					const item = await showCreateDialog();
					if (item) {
						navigate(getRoutes(item.project, item._id).edit);
					}
				}}
				canCreate={canCreateLookupTable && !!project}
				globalActions={
					<Button
						color='secondary'
						size='small'
						onClick={() => importLookupTable({})}
						tooltipTitle={canImportLookupTable ? `Import ${featureName}` : PERMISSIONS_TOOLTIP_MESSAGE}
						disabled={!canImportLookupTable || (!project && 'Select a project first')}
						startIcon={faFileImport}
					>
						Import
					</Button>
				}
				filters={
					<>
						<Filters.Title />
						<Filters.NameFilter />
						<Filters.CreatedRangeFilter />
						<Filters.ProjectNameFilter />
						<Filters.CreatedByFilter />
						<Filters.TagsFilter />
					</>
				}
				itemDetails={[
					{
						...Fields.name,
						canRename: (item) =>
							ability.can(ACTIONS.Update, subject(caslSubject, { project: item?.project?._id })),
						onRename: (value, item) => {
							if (featureName === 'Scenario Lookup Tables') {
								return saveScenarioLookupTable(item._id, {
									name: value,
								});
							}
							return saveTypeCurveLookupTable(item._id, { name: value });
						},
					},
					Fields.createdBy,
					Fields.createdAt,
					Fields.project,
					Fields.tags,
				]}
				itemActions={(item) => [
					{
						label: 'Import to Current Project',
						icon: faFileImport,
						onClick: () =>
							importLookupTable({
								lookupTableId: item._id,
								runFilters,
							}),
						disabled:
							(!canCreateLookupTable && PERMISSIONS_TOOLTIP_MESSAGE) ||
							project?._id === item?.project?._id ||
							(!project && 'Select a project first'),
					},
				]}
				copyNotification={copyNotification}
				onCopy={onCopy}
				canCopy={(item) => ability.can(ACTIONS.Create, subject(caslSubject, { project: item?.project?._id }))}
				onDelete={async (item) => deleteLookupTable(item._id)}
				canDelete={(item) => ability.can(ACTIONS.Delete, subject(caslSubject, { project: item?.project?._id }))}
				workMe={(item) => navigate(getRoutes(item?.project?._id, item._id).edit)}
				selectionActions={
					<>
						<Button
							tooltipTitle={
								selection?.selectedSet?.size > MAX_COPYABLE_MODELS
									? `Cannot import over ${MAX_COPYABLE_MODELS} lookup tables`
									: 'Import to Current Project'
							}
							disabled={
								selection?.selectedSet?.size === 0 ||
								selection?.selectedSet?.size > MAX_COPYABLE_MODELS ||
								(!canCreateLookupTable && PERMISSIONS_TOOLTIP_MESSAGE) ||
								(!project && 'Select a project first')
							}
							onClick={() => handleMassImport([...(selection?.selectedSet ?? [])])}
							startIcon={faFileImport}
						>
							Import to Project
						</Button>
						<MassDeleteButton
							disabled={!selection?.selectedSet?.size}
							feat='Lookup Table'
							feats='Lookup Tables'
							length={selection?.selectedSet?.size}
							requireName
							onDelete={async () => {
								const ids = [...(selection?.selectedSet || [])];
								const deleted = await massDeleteLookupTables(ids);

								if (ids.length !== deleted) {
									confirmationAlert(`${deleted} out of ${ids.length} Lookup Tables deleted`);
								} else {
									confirmationAlert(
										`${pluralize(ids.length, 'Lookup Table', 'Lookup Tables')} deleted`
									);
								}
							}}
							refresh={runFilters}
						/>
					</>
				}
			/>
		</>
	);
}
