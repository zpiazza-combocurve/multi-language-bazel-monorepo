import { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import { usePermissionsBuilder } from '@/access-policies/usePermissions';
import { alerts } from '@/components/v2';
import { fetchWellsAndCollections } from '@/forecasts/api';
import { confirmationAlert, createConfirmAddWells, genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { putApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import { assert } from '@/helpers/utilities';
import { MAX_WELLS_PERFORMANCE_TYPECURVE } from '@/inpt-shared/constants';
import WellsPageWithSingleWellViewDialog from '@/manage-wells/WellsPageWithSingleWellViewDialog';
import { showWellFilter } from '@/well-filter/well-filter';

import { NO_FORECAST_MESSAGE } from './TypeCurveSettings';
import { cacheTcData, useTypeCurve } from './api';

const api = {
	getForecastWellsAndCollections: (forecastId: Inpt.ObjectId) => fetchWellsAndCollections(forecastId),
	addWells: (tcId: Inpt.ObjectId, wells: string[]) => putApi(`/type-curve/${tcId}/addTypeCurveWells`, { wells }),
	removeWells: (tcId: Inpt.ObjectId, wells: string[]) =>
		putApi(`/type-curve/${tcId}/removeTypeCurveWells`, { wells }),
};

export function TypeCurveManageWells({ typeCurveId }: { typeCurveId: string }) {
	const { data: typeCurve } = useTypeCurve(typeCurveId); // TODO make sure it's loaded
	assert(typeCurve);
	const reload = () => cacheTcData(typeCurveId, true);
	const { canUpdate: canUpdateTypeCurve } = usePermissionsBuilder(SUBJECTS.TypeCurves);
	const canUpdateCurrentTypeCurve = canUpdateTypeCurve(typeCurve);

	const filterWells = showWellFilter;

	const hasForecast = typeCurve.forecast;
	const forecastQueryKey = useMemo(
		() => ['type-curves', 'forecast-wells-and-collections', typeCurve.forecast],
		[typeCurve.forecast]
	);
	const { data: forecastWellsAndCollections, isLoading: forecastLoading } = useQuery(forecastQueryKey, () =>
		api.getForecastWellsAndCollections(typeCurve.forecast)
	);

	const forecastWells = useMemo(() => {
		if (!forecastWellsAndCollections) {
			return [];
		}
		return forecastWellsAndCollections.wellIds || [];
	}, [forecastWellsAndCollections]);

	const { isLoading: addingWells, mutateAsync: addWells } = useMutation(async (wells: string[]) => {
		const { msg } = await api.addWells(typeCurve._id, wells);
		confirmationAlert(msg);
		reload(); // TODO find better ways for this later than to reload
	});

	const { isLoading: removingWells, mutateAsync: removeWells } = useMutation(async (wells: string[]) => {
		const { msg } = await api.removeWells(typeCurve._id, wells);
		confirmationAlert(msg);
		reload();
	});

	const handleAdd = async (existingWells?: string[]) => {
		try {
			const wells = await filterWells({
				wells: hasForecast ? forecastWells : [],
				type: 'add',
				existingWells,
				confirm: createConfirmAddWells('type curve'),
				wellsPerformanceThreshold: MAX_WELLS_PERFORMANCE_TYPECURVE,
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
					module: 'type curve',
					wellsCount: wells.length,
					existingWells: existingWells.length,
					wellsPerformanceThreshold: MAX_WELLS_PERFORMANCE_TYPECURVE,
					points: [
						{ label: 'Type Curve', desc: 'Deletes type curve and all of its contents' },
						{ label: 'Econ Models', desc: 'Deletes all associated economic assumptions' },
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
	const loading = forecastLoading;

	useLoadingBar(updating);

	return (
		<WellsPageWithSingleWellViewDialog
			wellIds={typeCurve.wells}
			padded
			addWellsProps={{
				onAdd: handleAdd,
				disabled:
					(!canUpdateCurrentTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) || updating || loading || !hasForecast,
				restButtonProps: { tooltipTitle: hasForecast ? 'Add wells to the type curve' : NO_FORECAST_MESSAGE },
			}}
			removeWellsProps={{
				onRemove: handleRemove,
				disabled: (selectedWells) =>
					(!canUpdateCurrentTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) ||
					updating ||
					loading ||
					!hasForecast ||
					!selectedWells.length,
				getTooltipTitle: (wells) =>
					hasForecast
						? `Remove ${pluralize(wells.length, 'well', 'wells')} from type curve`
						: NO_FORECAST_MESSAGE,
			}}
		/>
	);
}
