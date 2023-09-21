import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import usePermissions from '@/access-policies/usePermissions';
import { Placeholder } from '@/components';
import { ButtonItem, MenuButton, alerts } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { confirmationAlert, createConfirmAddWells, genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { getApi, postApi, putApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import { assert } from '@/helpers/utilities';
import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { MAX_WELLS_PERFORMANCE_FORECAST } from '@/inpt-shared/constants';
import WellsPageWithSingleWellViewDialog from '@/manage-wells/WellsPageWithSingleWellViewDialog';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { showWellFilter } from '@/well-filter/well-filter';
import { useWellsCollectionsQuery } from '@/wells-collections/queries';

import { invalidateAllForecastQueries } from './charts/components/deterministic/grid-chart/api';

const api = {
	addWells: (forecastId: string, wells: string[]) => putApi(`/forecast/${forecastId}/addForecastWells`, { wells }),
	removeWells: (forecastId: string, wells: string[]) =>
		putApi(`/forecast/${forecastId}/removeForecastWells`, { wells }),
};

function Operations({ selection, forecast, reload, updating }) {
	const { project, updateProject } = useCurrentProject();
	assert(project);
	const { invalidate: invalidateWellsCollectionsQuery } = useWellsCollectionsQuery(project?._id, !!project);

	const duplicateWellsNotificationCallback = useCallback(
		async (notification) => {
			if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.forecastId === forecast._id) {
				const wellIds = await getApi(`/projects/getProjectWellIds/${project._id}`);
				const newProject = { ...project, wells: wellIds };
				updateProject(newProject);
				invalidateWellsCollectionsQuery();
				reload();
			}
		},
		[updateProject, forecast._id, project, reload, invalidateWellsCollectionsQuery]
	);
	useUserNotificationCallback(NotificationType.DUPLICATE_FORECAST_WELLS, duplicateWellsNotificationCallback);

	const duplicateForecastWells = async (wells) => {
		try {
			await postApi(`/forecast/${forecast._id}/duplicate-forecast-wells`, {
				wellIds: wells,
			});
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const handleDuplicateForecastWells = async () => {
		const wells = [...selection.selectedSet];
		const confirmed = await alerts.confirm({
			title: 'Copy Wells',
			children: `Copy ${pluralize(wells.length, 'well', 'wells')}`,
		});
		if (confirmed) {
			duplicateForecastWells(wells);
		}
	};

	const queryClient = useQueryClient();

	const removeLeadingZerosNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				queryClient.invalidateQueries(['well-headers']);
			}
		},
		[queryClient]
	);

	useUserNotificationCallback(NotificationType.REMOVE_LEADING_ZEROS, removeLeadingZerosNotificationCallback);

	const removeLeadingZeros = async ({ wells }) => {
		try {
			await postApi('/well/remove-leading-zeros', { wellIds: wells });
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const handleRemoveLeadingZeros = async () => {
		const wells = [...selection.selectedSet];
		const confirmed = await alerts.confirm({
			title: 'Remove Leading Zeros',
			children: `Remove leading zeros from production data for ${pluralize(wells.length, 'well', 'wells')}`,
			confirmText: 'Remove',
			confirmColor: 'error',
		});

		if (confirmed) {
			removeLeadingZeros({
				wells,
			});
		}
	};

	const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, project._id);

	return (
		<MenuButton
			css='text-transform: unset;'
			label='Operations'
			endIcon={faChevronDown}
			list
			disabled={!selection.selectedSet.size}
		>
			<ButtonItem
				label='Copy Wells'
				onClick={handleDuplicateForecastWells}
				disabled={
					(!canUpdateForecast && PERMISSIONS_TOOLTIP_MESSAGE) || selection.selectedSet.size === 0 || updating
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				tooltipTitle='Copy forecast wells. Corresponding forecasts will be copied too'
			/>
			<ButtonItem
				label='Remove Leading Zeros'
				onClick={handleRemoveLeadingZeros}
				disabled={
					(!canUpdateForecast && PERMISSIONS_TOOLTIP_MESSAGE) || selection.selectedSet.size === 0 || updating
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				tooltipTitle='Remove monthly and daily production data of selected wells prior to first non-zero production date'
			/>
		</MenuButton>
	);
}

export function ForecastManageWells({ forecastDocumentQuery, toggleAll }) {
	const { isLoading, data: forecast } = forecastDocumentQuery;
	const reload = useCallback(() => invalidateAllForecastQueries(true), []);
	const { project } = useCurrentProject();
	assert(project);
	const filterWells = showWellFilter;
	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, project._id);

	const { isLoading: addingWells, mutateAsync: addWells } = useMutation(async (wells: string[]) => {
		const { msg } = await api.addWells(forecast._id, wells);
		confirmationAlert(msg);
		reload(); // TODO find better ways for this later than to reload
	});

	const { isLoading: removingWells, mutateAsync: removeWells } = useMutation(async (wells: string[]) => {
		const { msg } = await api.removeWells(forecast._id, wells);
		toggleAll({ checked: false, wellIds: wells, suppressConfirmation: true });
		confirmationAlert(msg);
		reload();
	});

	const handleAdd = async (existingWells: string[]) => {
		try {
			const wells = await filterWells({
				wells: project.wells,
				type: 'add',
				existingWells,
				confirm: createConfirmAddWells('forecast', isWellsCollectionsEnabled),
				wellsPerformanceThreshold: MAX_WELLS_PERFORMANCE_FORECAST,
			});
			if (wells) {
				await addWells(wells);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const handleRemove = async (selectedWells: string[], getWellIds: () => Promise<string[]>) => {
		try {
			const wells = selectedWells;
			const existingWells = await getWellIds();

			if (
				!(await alerts.confirmRemoveWells({
					module: 'forecast',
					wellsCount: wells.length,
					existingWells: existingWells.length,
					wellsPerformanceThreshold: MAX_WELLS_PERFORMANCE_FORECAST,
					points: [
						{ label: 'Forecast', desc: 'Deletes forecast and all of its contents' },
						{ label: 'Type Curve', desc: 'Remove wells from associated type curves' },
					],
				}))
			) {
				return;
			}

			await removeWells(wells);
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const updating = addingWells || removingWells;

	useLoadingBar(updating);

	if (isLoading) {
		return <Placeholder main loading loadingText='Loading Forecast' />;
	}

	return (
		<WellsPageWithSingleWellViewDialog
			wellIds={forecast.wells}
			padded
			addWellsProps={{
				onAdd: handleAdd,
				disabled: (!canUpdateForecast && PERMISSIONS_TOOLTIP_MESSAGE) || updating,
				restButtonProps: { tooltipTitle: 'Add wells to the forecast' },
			}}
			removeWellsProps={{
				onRemove: handleRemove,
				disabled: (selectedWells) =>
					(!canUpdateForecast && PERMISSIONS_TOOLTIP_MESSAGE) || updating || !selectedWells.length,
				getTooltipTitle: (wells) => `Remove ${pluralize(wells.length, 'well', 'wells')} from forecast`,
			}}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			operations={Operations}
			operationsProps={{ forecast, reload, toggleAll, updating }}
			addRemoveWellsCollectionWells
		/>
	);
}
