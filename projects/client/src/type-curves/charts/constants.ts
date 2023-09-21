import type { ChartSettings } from '@/forecasts/charts/useChartSettings';
import { forecastMinMaxArrToMenuItems } from '@/forecasts/shared/forecast-menu-helpers';

// HACK: use cumsum to get access to absolute values
export const DEFAULT_NORMALIZATION_CHART_SETTINGS: Pick<
	ChartSettings,
	'xAxis' | 'cumMin' | 'cumMax' | 'yMin' | 'yMax'
> = {
	xAxis: 'cumsum_oil',
	cumMin: 'all',
	cumMax: 'all',
	yMin: 'all',
	yMax: 'all',
};

export const DEFAULT_NORMALIZATION_X_MAX_ITEMS = forecastMinMaxArrToMenuItems([
	250,
	500,
	1_000,
	2_500,
	5_000,
	10_000,
	25_000,
	50_000,
	100_000,
	'all',
]);

export const DEFAULT_NORMALIZATION_X_MIN_ITEMS = forecastMinMaxArrToMenuItems([0.01, 0.1, 1, 10, 100, 'all']);
