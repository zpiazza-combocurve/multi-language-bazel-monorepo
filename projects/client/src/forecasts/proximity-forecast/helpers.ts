import produce from 'immer';
import { set } from 'lodash-es';
import { useMemo } from 'react';

import { useCumsAndEur } from '@/forecasts/shared/forecastCalcHooks';

import { useWellHeaderValues } from '../api';
import { VALID_PHASES } from '../charts/components/graphProperties';

const EMPTY_OBJ = {};

export const useProximityTargetWellInfo = ({
	wellId,
	deterministicWellData,
	tempAutoChartData,
	parentResolution,
	manualGridSeries,
	mode,
	phase,
	editingChartPhaseType,
	editingChartBasePhase,
}) => {
	const deterministicData = useMemo(() => {
		if (mode === 'auto') {
			return tempAutoChartData ?? deterministicWellData ?? EMPTY_OBJ;
		}
		if (mode === 'manual') {
			// HACK: copied from manualCharts.tsx: manualDeterministicData = useMemo, 184
			const setTempData = (basePath, data) => {
				// set forecastType
				set(data, `${basePath}.forecastType`, editingChartPhaseType);

				// set series
				const seriesKey =
					editingChartPhaseType === 'rate' ? `${basePath}.P_dict` : `${basePath}.ratio.segments`;

				const thisSeries =
					editingChartPhaseType === 'rate' ? { best: { segments: manualGridSeries } } : manualGridSeries;

				set(data, seriesKey, thisSeries);

				// set resolution
				set(data, `${basePath}.data_freq`, parentResolution);

				if (editingChartPhaseType === 'ratio') {
					// set base phase
					set(data, `${basePath}.ratio.basePhase`, editingChartBasePhase);
					set(data, `${basePath}.ratio.x`, 'time');
				}
			};

			return (
				produce(deterministicWellData, (data) => {
					const basePath = `forecast.${phase}`;
					setTempData(basePath, data);
				}) ?? EMPTY_OBJ
			);
		}

		return EMPTY_OBJ;
	}, [
		mode,
		tempAutoChartData,
		deterministicWellData,
		editingChartPhaseType,
		manualGridSeries,
		parentResolution,
		editingChartBasePhase,
		phase,
	]);

	const { daily: dailyProduction, monthly: monthlyProduction, forecast } = deterministicData;

	const { data: wellHeaders } = useWellHeaderValues(wellId, 'all');

	const { dailyCums, monthlyCums, forecastCalcs } = useCumsAndEur({
		dailyProduction,
		monthlyProduction,
		forecasts: forecast,
		type: 'deterministic',
		resolution: parentResolution,
	});

	return useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const ret: any = {
			header: wellHeaders ?? {},
			dailyCums,
			monthlyCums,
			eur: { oil: 0, gas: 0, water: 0 },
			forecast_info: {},
			data_info: { oil: true, gas: true, water: true },
			valid: { oil: true, gas: true, water: true },
		};

		VALID_PHASES.forEach((p) => {
			ret.eur[p] = forecastCalcs?.[p]?.eur ?? 0;
			ret.forecast_info[p] = {
				forecast_data_freq: parentResolution,
				forecast_type: forecast?.[p].forecastType,
				has_forecast: null,
			};
			ret.data_info[p] = { has_data: true };
		});

		return ret;
	}, [wellHeaders, dailyCums, monthlyCums, forecastCalcs, parentResolution, forecast]);
};
