import { faCodeMerge, faFileImport } from '@fortawesome/pro-light-svg-icons';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { ACTIONS, Can, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import usePermissions, { buildPermissions } from '@/access-policies/usePermissions';
import { useCallbackRef } from '@/components/hooks';
import { Button } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import NewForecastDialog from '@/forecasts/NewForecastDialog';
import { forecastPaths } from '@/forecasts/routes';
import { confirmationAlert, genericErrorAlert, warningAlert } from '@/helpers/alerts';
import { toLocalDate, toLocalDateTime } from '@/helpers/dates';
import { useDialog } from '@/helpers/dialog';
import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import { MassDeleteButton } from '@/module-list/ModuleList/components';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import ImportDialog from '@/module-list/shared/ImportDialog';
import { FilterResult } from '@/module-list/types';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { URLS } from '@/urls';

const MAX_COPYABLE_MODELS = 100;

type ForecastItem = Pick<
	Inpt.Forecast,
	'_id' | 'name' | 'type' | 'createdAt' | 'createdBy' | 'diagDate' | 'updatedAt'
> & { createdBy: Inpt.User; project: Inpt.Project; wellsLength: number };

function getForecastLabel(forecast: ForecastItem) {
	if (forecast.type === 'deterministic') {
		return 'Deterministic';
	}
	if (forecast.type === 'probabilistic') {
		return 'Probabilistic';
	}
	return 'Unknown';
}

const extraDeleteOptions = {
	enabled: true,
	info: 'Delete all associated type curves',
};

export default function ForecastMod() {
	const [importDialog, promptImportDialog] = useDialog(ImportDialog);
	const { project } = useCurrentProject();
	const navigate = useNavigate();

	const onCopy = ({ _id: forecastId }) => postApi(`/forecast/${forecastId}/copy`);

	const navForecast = (param: keyof typeof forecastPaths) => async (forecast: ForecastItem) => {
		navigate(URLS.project(forecast.project._id).forecast(forecast._id)[param]);
	};

	const workMe = navForecast('view');

	const { ability, canCreate: canCreateForecast } = usePermissions(SUBJECTS.Forecasts, project?._id);

	const { runFilters, moduleListProps, selection } = useModuleListRef({
		createdBy: '',
		dateMax: '',
		dateMin: '',
		project: project?.name ?? '',
		projectExactMatch: !!project?.name,
		selectedProject: project,
		search: '',
		sort: 'updatedAt',
		sortDir: -1,
		tags: [],
		wellsMax: '',
		wellsMin: '',
	});

	const importForecastNotificationCallback = useCallback(
		async (notification) => {
			if (
				notification.status === TaskStatus.COMPLETED &&
				notification.extra?.body?.targetProjectId === project?._id
			) {
				runFilters?.();
			}
		},
		[project, runFilters]
	);
	useUserNotificationCallback(NotificationType.IMPORT_FORECAST, importForecastNotificationCallback);

	const importForecast = useCallbackRef(async (forecast) => {
		const data = await promptImportDialog({ feat: 'Forecast', isTypecurve: false });
		if (!data) {
			return;
		}
		const { id, updateOnly } = data;

		try {
			await postApi(`/forecast/${forecast._id}/import`, {
				targetProjectId: project?._id,
				wellIdentifier: id,
				importOverlappingWellsOnly: updateOnly,
			});
		} catch (err) {
			genericErrorAlert(err);
		}
	});

	const importSelectedForecasts = async (modelIds) => {
		const modelsCount = modelIds.length;

		if (modelsCount > MAX_COPYABLE_MODELS) {
			warningAlert(
				`You are trying to import ${modelsCount} models. Cannot import over ${MAX_COPYABLE_MODELS} models. Use the filters to lower the number of models imported.`,
				2000
			);
			return;
		}

		const data = await promptImportDialog({ feat: 'Forecast', isTypecurve: false });
		if (!data) {
			return;
		}
		const { id, updateOnly } = data;

		try {
			await postApi(`/forecast/mass-import`, {
				targetProjectId: project?._id,
				wellIdentifier: id,
				importOverlappingWellsOnly: updateOnly,
				forecastIds: modelIds,
			});
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const [createDialog, showCreateDialog] = useDialog(NewForecastDialog, {
		wells: project?.wells,
		project,
	});

	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	return (
		<>
			{importDialog}
			{createDialog}
			<ModuleList
				{...moduleListProps}
				feat='Forecast'
				fetch={(body) => getApi('/forecast', body) as Promise<FilterResult<ForecastItem>>}
				useTags='forecast'
				onCreate={showCreateDialog}
				canCreate={canCreateForecast && !!project}
				requireNameToDelete
				globalActions={
					<Can do={ACTIONS.Create} on={subject(SUBJECTS.Forecasts, { project: project?._id })} passThrough>
						{(allowed) => (
							<Button
								color='secondary'
								disabled={(!allowed && PERMISSIONS_TOOLTIP_MESSAGE) || !project?._id}
								onClick={() => navigate(URLS.project(project?._id ?? 'invalid').forecastMerge)}
								tooltipTitle='Merge Forecast'
								startIcon={faCodeMerge}
							>
								Merge
							</Button>
						)}
					</Can>
				}
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
							buildPermissions(ability, SUBJECTS.Forecasts, item?.project?._id).canUpdate,
						onRename: (value, item) => putApi(`/forecast/${item._id}/updateForecastName`, { name: value }),
					},
					{ key: 'forecastType', label: 'Forecast Type', value: getForecastLabel },
					Fields.createdBy,
					Fields.createdAt,
					Fields.updatedAt,
					{
						key: 'lastDiagnosed',
						label: 'Last Diagnosed',
						value: ({ diagDate }) => toLocalDate(diagDate, 'Never'),
						title: ({ diagDate }) => toLocalDateTime(diagDate, 'Never'),
					},
					Fields.wells,
					...(isWellsCollectionsEnabled ? [Fields.wellCollections] : []),
					Fields.project,
					Fields.tags,
				]}
				copyNotification={NotificationType.COPY_FORECAST}
				onCopy={onCopy}
				canCopy={(item) => buildPermissions(ability, SUBJECTS.Forecasts, item?.project?._id).canCreate}
				onDelete={(item, deleteTypeCurves) =>
					deleteApi(`/forecast/${item._id}?deleteTypeCurves=${deleteTypeCurves}`)
				}
				extraDeleteOptions={extraDeleteOptions}
				canDelete={(item) => buildPermissions(ability, SUBJECTS.Forecasts, item?.project?._id).canDelete}
				itemActions={useCallback(
					(item) => [
						{
							label: 'Import to Current Project',
							icon: faFileImport,
							onClick: () => importForecast(item),
							disabled:
								(!canCreateForecast && PERMISSIONS_TOOLTIP_MESSAGE) ||
								project?._id === item?.project?._id,
						},
					],
					[canCreateForecast, project?._id, importForecast]
				)}
				workMe={workMe}
				selectionActions={
					<>
						<Button
							tooltipTitle={
								selection?.selectedSet?.size > MAX_COPYABLE_MODELS
									? `Cannot import over ${MAX_COPYABLE_MODELS} forecasts`
									: 'Import to Current Project'
							}
							disabled={
								selection?.selectedSet?.size === 0 ||
								selection?.selectedSet?.size > MAX_COPYABLE_MODELS ||
								(!canCreateForecast && PERMISSIONS_TOOLTIP_MESSAGE)
							}
							onClick={() => importSelectedForecasts([...(selection?.selectedSet ?? [])])}
							startIcon={faFileImport}
						>
							Import to Project
						</Button>
						<MassDeleteButton
							disabled={!selection?.selectedSet?.size}
							feat='Forecast'
							feats='Forecasts'
							length={selection?.selectedSet?.size}
							requireName
							onDelete={(deleteTypeCurves) => {
								const ids = [...(selection?.selectedSet || [])];

								return postApi('/forecast/mass-delete', {
									ids,
									deleteTypeCurves,
								}).then((deleted) => {
									if (ids.length !== deleted) {
										confirmationAlert(`${deleted} out of ${ids.length} forecasts deleted`);
									} else {
										confirmationAlert(`${pluralize(ids.length, 'forecast', 'forecasts')} deleted`);
									}
								});
							}}
							refresh={runFilters}
							extraOption={extraDeleteOptions}
						/>
					</>
				}
			/>
		</>
	);
}
