import { useMemo } from 'react';
import { useQuery } from 'react-query';

import { useDebouncedValue } from '@/helpers/debounce';
import { postApi } from '@/helpers/routing';

import { ForecastScopeObj, getEnabledPhases } from '../ForecastFormV2';
import { ForecastFormResolution } from '../automatic-form/types';
import { UseProximityForecastReturn } from './useProximityForecast';

function useProximityBinning({
	forecastId,
	form,
	forecastScope,
	resolution,
	wells,
}: Pick<UseProximityForecastReturn, 'form'> & {
	forecastId: string;
	forecastScope: ForecastScopeObj;
	resolution: ForecastFormResolution;
	wells: Array<string>;
}) {
	const { watch } = form;

	const [_applyAll, _dataThreshold, enabledOil, enabledGas, enabledWater] = watch([
		'applyAll',
		'dataThreshold',
		'phases.oil',
		'phases.gas',
		'phases.water',
	]);

	const { applyAll, dataThreshold, phases } = useDebouncedValue(
		{
			applyAll: _applyAll,
			dataThreshold: _dataThreshold,
			phases: { oil: enabledOil, gas: enabledGas, water: enabledWater },
		},
		2000
	);

	const body = useMemo(
		() => ({
			dataThreshold: Number(dataThreshold),
			phases: applyAll ? ['oil', 'gas', 'water'] : getEnabledPhases(phases),
			resolution,
			wells,
		}),
		[applyAll, dataThreshold, phases, resolution, wells]
	);

	return useQuery(
		['forecast', 'proximity', body],
		() => postApi(`/forecast/${forecastId}/wells-forecast-method`, body),
		{
			enabled: forecastScope.auto && forecastScope.proximity,
			placeholderData: {
				autoWells: [],
				proximityWells: [],
			},
		}
	);
}

export default useProximityBinning;
