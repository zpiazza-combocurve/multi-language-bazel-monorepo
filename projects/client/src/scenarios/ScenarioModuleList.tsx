import { useAbility } from '@casl/react';
import { faCodeMerge } from '@fortawesome/pro-light-svg-icons';
import { faFileImport } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash-es';
import { useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import usePermissions, { buildPermissions } from '@/access-policies/usePermissions';
import { useCallbackRef } from '@/components/hooks';
import { Button, alerts } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { getApi, postApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import { MassDeleteButton } from '@/module-list/ModuleList/components';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FiltersContext } from '@/module-list/filters/shared';
import { FilterResult } from '@/module-list/types';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { deleteScenario, getScenario, getScenarioQueryKey } from '@/scenarios/api';
import { URLS } from '@/urls';

import { MAX_NUMBER_OF_SCENARIOS_TO_MERGE } from './MergeScenarios/constants';
import NewScenario from './ScenarioModuleList/NewScenario';
import ScenarioImportDialog from './ScenarioModuleList/ScenarioImportDialog';

const MAX_COPYABLE_SCENARIOS = 25;
const MAX_DELETABLE_SCENARIOS = 50;
const IMPORT_NOTE_NETWORKS = `This will import ALL wells in the associated networks regardless of wells in the scenario or project`;
const IMPORT_NOTE_2 = `If there are econ models from imported scenario having names that already exist in the corresponding category in your current project, you can replace them with the imported models or create duplicates with new names`;
const confirmEconModelImport = (): Promise<null | 'replace' | 'duplicate'> => {
	return alerts.prompt({
		title: 'Import Scenario',
		children: IMPORT_NOTE_2,
		actions: [
			{ children: 'Cancel', value: null },
			{ children: 'Import (replace)', value: 'replace', color: 'primary' },
			{ children: 'Import (duplicate)', value: 'duplicate', color: 'primary' },
		],
	});
};

function useImportScenarios(runFilters) {
	const { project, updateProject } = useCurrentProject();

	const importScenarioNotificationCallback = useCallback(
		async (notification) => {
			if (
				notification.status === TaskStatus.COMPLETED &&
				notification.extra?.body?.targetProjectId === project?._id
			) {
				const wellIds = await getApi(`/projects/getProjectWellIds/${project?._id}`);
				const newProject = { ...project, wells: wellIds };
				updateProject(newProject);
				runFilters?.();
			}
		},
		[runFilters, updateProject, project]
	);
	useUserNotificationCallback(NotificationType.IMPORT_SCENARIO, importScenarioNotificationCallback);

	const importScenarios = async ({
		scenarioIds,
		id,
		importOverlapOnly,
		importEconModels,
		importForecasts,
		importSchedules,
		importLookups,
		importNetworks,
		replaceEconModels,
	}) => {
		const massImport = scenarioIds.length > 1;
		const url = massImport ? '/scenarios/mass-import' : `/scenarios/${scenarioIds[0]}/import`;

		try {
			await postApi(url, {
				scenarioIds: massImport ? scenarioIds : undefined,
				projectId: project?._id,
				wellIdentifier: id,
				importOverlappingWellsOnly: importOverlapOnly,
				importAssumptions: importEconModels,
				importForecasts,
				importSchedules,
				importLookups,
				importNetworks,
				replaceEconModels,
			});
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const isSameProject = useCallbackRef((scenario) => project?._id === scenario?.project?._id);

	const [importDialog, promptImportDialog] = useDialog(ScenarioImportDialog);

	const handleImport = async (scenarioIds: string[]) => {
		const data = await promptImportDialog({});
		if (data) {
			const { importEconModels, importNetworks } = data;
			let replaceEconModels = false;

			if (
				importNetworks &&
				!(await alerts.prompt({
					title: 'Importing networks from scenario',
					children: IMPORT_NOTE_NETWORKS,
					actions: [
						{ children: 'Cancel', value: null },
						{ children: 'Import', value: true, color: 'primary' },
					],
				}))
			) {
				return;
			}

			if (importEconModels) {
				const result = await confirmEconModelImport();

				if (result === null) {
					return;
				}

				replaceEconModels = result === 'replace';
			}
			importScenarios({ ...data, replaceEconModels, scenarioIds });
		}
	};

	return { importScenarios: handleImport, isSameProject, importDialog };
}

type ScenarioItem = Assign<
	Inpt.Scenario,
	{
		project: Inpt.Project;
		createdBy: Inpt.User;
		wellsLength: number;
	}
>;

export default function ScenarioMod() {
	const { project, updateProject } = useCurrentProject();
	const navigate = useNavigate();
	const ability = useAbility(AbilityContext);
	const [newScenarioDialog, showNewScenarioDialog] = useDialog(NewScenario);

	const { runFilters, moduleListProps } = useModuleListRef({
		createdBy: '',
		dateMax: '',
		dateMin: '',
		project: project?.name ?? '',
		projectExactMatch: !!project?.name,
		search: '',
		sort: 'createdAt',
		sortDir: -1,
		tags: [],
		wellsMax: '',
		wellsMin: '',
	});

	const { canCreate: canCreateScenarios } = usePermissions(SUBJECTS.Scenarios, project?._id);

	const { importScenarios, isSameProject, importDialog } = useImportScenarios(runFilters);

	const queryClient = useQueryClient();

	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	return (
		<>
			{importDialog}
			{newScenarioDialog}
			<ModuleList
				{...moduleListProps}
				feat='Scenario'
				fetch={(body) => getApi('/scenarios', body) as Promise<FilterResult<ScenarioItem>>}
				useTags='scenario'
				onCreate={showNewScenarioDialog}
				canCreate={canCreateScenarios && !!project}
				filters={
					<>
						<Filters.Title />
						<Filters.NameFilter />
						<Filters.CreatedRangeFilter />
						<Filters.WellsRangeFilter />
						<Filters.ProjectNameFilter />
						<Filters.CreatedByFilter />
						<Filters.TagsFilter />
					</>
				}
				itemDetails={[
					{
						...Fields.name,
						canRename: (item) =>
							ability.can(ACTIONS.Update, subject(SUBJECTS.Scenarios, { project: item?.project?._id })),
						onRename: (value, item) => postApi(`/scenarios/${item._id}/changeName`, { name: value }),
					},
					Fields.createdBy,
					Fields.createdAt,
					Fields.wells,
					...(isWellsCollectionsEnabled ? [Fields.wellCollections] : []),
					Fields.project,
					Fields.tags,
				]}
				copyNotification={NotificationType.COPY_SCENARIO}
				onCopy={({ _id: scenarioId }) => postApi(`/scenarios/${scenarioId}/copy`)}
				canCopy={(item) => buildPermissions(ability, SUBJECTS.Scenarios, item?.project?._id).canCreate}
				onDelete={async (item) => {
					await deleteScenario(item._id);
					if (project) {
						updateProject({
							...project,
							scenarios: project?.scenarios.filter((s) => s !== item._id),
						});
					}
				}}
				canDelete={(item) => buildPermissions(ability, SUBJECTS.Scenarios, item?.project?._id).canDelete}
				requireNameToDelete
				itemActions={useCallback(
					(item) => [
						{
							onClick: () => importScenarios([item._id]),
							icon: faFileImport,
							disabled:
								!project?._id ||
								(!canCreateScenarios && PERMISSIONS_TOOLTIP_MESSAGE) ||
								isSameProject(item),
							label: 'Import to Current Project',
						},
					],
					[project, isSameProject, canCreateScenarios, importScenarios]
				)}
				workMe={useCallback(
					(scenarioItem: ScenarioItem) => {
						const key = getScenarioQueryKey(scenarioItem._id);
						navigate(URLS.project(scenarioItem.project._id).scenario(scenarioItem._id).view);
						queryClient.setQueryData(key, _.pick(scenarioItem, ['name', '_id', 'project']));
						queryClient.prefetchQuery(key, () => getScenario(scenarioItem._id));
					},
					[navigate, queryClient]
				)}
				selectionActions={
					<FiltersContext.Consumer>
						{({ selection: receivedSelection, items }) => {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
							const selectedIds = [...receivedSelection!.selectedSet];
							const scenarios = items?.length ? items.filter((s) => selectedIds.indexOf(s._id) > -1) : [];
							const mergeButtonEnabled =
								scenarios.length === MAX_NUMBER_OF_SCENARIOS_TO_MERGE &&
								scenarios[0].project._id === scenarios[1].project._id;
							const firstMergeScenarioId = mergeButtonEnabled ? scenarios[0]._id : '';
							const secondMergeScenarioId = mergeButtonEnabled ? scenarios[1]._id : '';

							return (
								<>
									<Button
										tooltipTitle={
											canCreateScenarios
												? 'Select 2 scenarios from the same project to merge them'
												: PERMISSIONS_TOOLTIP_MESSAGE
										}
										startIcon={faCodeMerge}
										disabled={!canCreateScenarios || !mergeButtonEnabled}
										onClick={() => {
											navigate(URLS.mergeScenarios(firstMergeScenarioId, secondMergeScenarioId));
										}}
									>
										Merge
									</Button>
									<Button
										tooltipTitle={
											selectedIds.length > MAX_COPYABLE_SCENARIOS
												? `Cannot import over ${MAX_COPYABLE_SCENARIOS} scenarios`
												: 'Import to Current Project'
										}
										disabled={
											!project?._id ||
											!selectedIds.length ||
											selectedIds.length > MAX_COPYABLE_SCENARIOS ||
											(!canCreateScenarios && PERMISSIONS_TOOLTIP_MESSAGE)
										}
										onClick={() => {
											importScenarios(selectedIds);
										}}
										startIcon={faFileImport}
									>
										Import to Project
									</Button>
									<MassDeleteButton
										disabled={!selectedIds.length || selectedIds.length > MAX_DELETABLE_SCENARIOS}
										tooltipLabel={
											selectedIds.length > MAX_DELETABLE_SCENARIOS
												? `Cannot delete over ${MAX_DELETABLE_SCENARIOS} scenarios`
												: undefined
										}
										feat='Scenario'
										feats='Scenarios'
										length={selectedIds.length}
										requireName
										onDelete={() =>
											postApi('/scenarios/mass-delete', {
												ids: selectedIds,
											}).then((deletedIds: string[]) => {
												if (selectedIds.length !== deletedIds.length) {
													confirmationAlert(
														`${deletedIds.length} out of ${selectedIds.length} scenarios deleted`
													);
												} else {
													confirmationAlert(
														`${pluralize(
															selectedIds.length,
															'scenario',
															'scenarios'
														)} deleted`
													);
												}
												if (project) {
													updateProject({
														...project,
														scenarios: project?.scenarios.filter(
															(s) => !deletedIds.includes(s)
														),
													});
												}
											})
										}
										refresh={runFilters}
									/>
								</>
							);
						}}
					</FiltersContext.Consumer>
				}
			/>
		</>
	);
}
