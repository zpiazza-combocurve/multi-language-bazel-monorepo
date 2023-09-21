import _ from 'lodash';
import { cloneDeep, minBy } from 'lodash-es';

import { InfoTooltipWrapper } from '@/components/v2';
import { AxisValue } from '@/forecasts/charts/components/AxisControlSelection';
import { ChartSettings } from '@/forecasts/charts/useChartSettings';
import { forecastMinMaxArrToMenuItems } from '@/forecasts/shared';
import { C4_DATA_SERIES, FIT_SERIES } from '@/type-curves/TypeCurveFit/C4LegendOptions';

import {
	DEFAULT_NORMALIZATION_CHART_SETTINGS,
	DEFAULT_NORMALIZATION_X_MAX_ITEMS,
	DEFAULT_NORMALIZATION_X_MIN_ITEMS,
} from './constants';

type ViewerType = 'default' | 'normalization';

const viewerOptions = [
	'c4',
	'threePhaseFit',
	'cum',
	'sum',
	'fitCum',
	'rateVsCum',
	'eur',
	'ip',
	'crossplot',
	// 'table',
	'paramsTable',
	'map',
	'probit',
] as const;

type ViewerOptions = (typeof viewerOptions)[number];

const normalizationViewerOptions = ['linearFit', 'qPeakLinearFit', 'normalizationMultipliersTable'] as const;

type NormalizationViewerOptions = (typeof normalizationViewerOptions)[number];

type LoadingKey =
	| 'basesIsLoading'
	| 'eurDataIsLoading'
	| 'fitInitIsLoading'
	| 'headersMapIsLoading'
	| 'rawBackgroundIsLoading'
	| 'repInitLoading'
	| 'tcFitsIsLoading';

type LoadingStatuses = {
	[key in LoadingKey]: boolean;
};

type ChartViewerType = {
	// seems every chart already uses this as a Set, confirm that this should just be a set
	defaultActiveSeries?: Array<string>;

	defaultChartSettings?: ChartSettings;
	enableXMinMax?: boolean;
	enableYMinMax?: boolean;
	loadingStatusKeys?: Array<LoadingKey>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	series?: Record<string, any>;
	title: string;
	tooltip?: string;
	xMaxItems?: Array<{ value: AxisValue; label: string }>;
	xMinItems?: Array<{ value: AxisValue; label: string }>;
	yMaxItems?: Array<{ value: AxisValue; label: string }>;
};

const NUMERICAL_P_VALUES = [10, 50, 90];

const getPNumTimeArr = () => [...Array(51).keys()].map((val) => (val * 100) / 50);

const getAveragePercentile = (arr: Array<number>) => arr.reduce((total, val) => total + val, 0) / arr.length;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getMaxProdTime = (series: Array<Record<string, any>>) => minBy(series, 'values.0.0')?.values?.[0]?.[0];

const DEFAULT_MIN_MAX: Record<string, AxisValue> = {
	yMin: 'all',
	yMax: 'all',
	yearsBefore: 'all',
	yearsPast: 'all',
	cumMin: 'all',
	cumMax: 'all',
};

const INIT_VIEWER_KEYS: Array<ViewerOptions> = ['c4', 'crossplot', 'eur', 'map'];

const DEFAULT_GRID_CHART_SELECTION = INIT_VIEWER_KEYS.reduce(
	(obj, key, idx) => ({ ...obj, [`chart-${idx}`]: key }),
	{}
);

const FIT_OBJECT = {
	P10: 'P10 Fit',
	P50: 'P50 Fit',
	P90: 'P90 Fit',
	best: 'Best Fit',
};

const WELLS_P_OBJECT = {
	wellsP10: 'Wells P10',
	wellsP50: 'Wells P50',
	wellsP90: 'Wells P90',
};

const CUM_CHART_SERIES = {
	cum: 'Wells Cum',
	...FIT_OBJECT,
};

const SUM_CHART_SERIES = {
	sum: 'Wells Sum',
	...FIT_OBJECT,
};

const FIT_CUM_CHART_SERIES = {
	overlayForecast: 'Overlay Forecast',
	background: 'Background Wells',
	median: 'Wells P50',
	average: 'Wells Average',
	colAverage: 'Wells Average No Forecast',
	...FIT_OBJECT,
};

const C4_CHART_SERIES = {
	overlayForecast: 'Overlay Forecast',
	background: 'Background Wells',
	average: 'Wells Average',
	aveNoFst: 'Wells Average No Forecast',
	p10: 'Wells P10',
	p50: 'Wells P50',
	p90: 'Wells P90',
	p50NoFst: 'Wells P50 No Forecast',
	count: 'Well Count',
	...FIT_OBJECT,
};

export const C4_DATA_SERIES_LABELS = {
	average: 'Wells Average',
	colAverage: 'Wells Average No Forecast',
	colMedian: 'Wells P50 No Forecast',
	wellsP10: 'Wells P10',
	colWellsP10: 'Wells P10 No Forecast',
	median: 'Wells P50',
	wellsP90: 'Wells P90',
	colWellsP90: 'Wells P90 No Forecast',
	wellCount: 'Well Count',
};

const THREE_PHASE_FIT_SERIES = FIT_OBJECT;

const IP_CHART_SERIES = {
	peakRate: 'Wells Peak Rate',
	...WELLS_P_OBJECT,
	wellsAverage: 'Wells Average',
	...FIT_OBJECT,
};

const EUR_CHART_SERIES = {
	wellsEur: 'Wells EUR',
	...WELLS_P_OBJECT,
	wellsAverage: 'Wells Average',
	...FIT_OBJECT,
};

const PROX_EXCLUDE_KEYS: Array<string> = [];

const COLOR_BY_CHART_TYPES: Array<string> = ['fitCum', 'rateVsCum', 'c4', 'eur', 'ip', 'crossplot', 'probit'];

const EXCLUDE_SETTINGS_CHART_TYPES: Array<string> = [
	'map',
	'paramsTable',
	'linearFit',
	'normalizationMultipliersTable',
];

// utilize chartKey to access the properties
const chartViewerTypes: Record<ViewerOptions, ChartViewerType> = {
	cum: {
		defaultActiveSeries: Object.keys(CUM_CHART_SERIES),
		defaultChartSettings: { ...DEFAULT_MIN_MAX, xAxis: 'time', yLogScale: true },
		enableXMinMax: true,
		enableYMinMax: true,
		loadingStatusKeys: ['rawBackgroundIsLoading', 'fitInitIsLoading', 'repInitLoading', 'tcFitsIsLoading'],
		series: CUM_CHART_SERIES,
		title: 'Analog Well Set Cum Production Roll-Up',
		yMaxItems: forecastMinMaxArrToMenuItems([
			100,
			200,
			500,
			1_000,
			2_000,
			5_000,
			10_000,
			20_000,
			50_000,
			100_000,
			200_000,
			500_000,
			1_000_000,
			5_000_000,
			'all',
		]),
		tooltip:
			'Cum-time roll up of the wells used to generate the type curve & the Fit Series overlay. Selection has been disabled for this chart.',
	},
	sum: {
		defaultActiveSeries: Object.keys(SUM_CHART_SERIES),
		defaultChartSettings: { ...DEFAULT_MIN_MAX, yMin: 0.1, xAxis: 'time', yLogScale: true },
		enableXMinMax: true,
		enableYMinMax: true,
		loadingStatusKeys: ['rawBackgroundIsLoading', 'fitInitIsLoading', 'repInitLoading', 'tcFitsIsLoading'],
		series: SUM_CHART_SERIES,
		title: 'Analog Well Set Production Roll-Up',
		yMaxItems: forecastMinMaxArrToMenuItems([
			100,
			200,
			500,
			1_000,
			2_000,
			5_000,
			10_000,
			20_000,
			50_000,
			100_000,
			200_000,
			'all',
		]),
		tooltip:
			'Prod-time roll up of the wells used to generate the type curve fit & the Fit Series overlay. Selection has been disabled for this chart.',
	},
	fitCum: {
		defaultActiveSeries: Object.keys(FIT_CUM_CHART_SERIES),
		defaultChartSettings: { ...DEFAULT_MIN_MAX, xAxis: 'time', yLogScale: false },
		enableXMinMax: true,
		enableYMinMax: true,
		series: FIT_CUM_CHART_SERIES,
		title: 'Cumulative Profile',
		tooltip: 'Cum-time plot of the individual type curve wells production + forecast & the Fit Series overlay',
		yMaxItems: forecastMinMaxArrToMenuItems([100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 'all']),
	},
	rateVsCum: {
		defaultActiveSeries: Object.keys(FIT_CUM_CHART_SERIES),
		defaultChartSettings: { ...DEFAULT_MIN_MAX, xAxis: 'cumsum_oil', yLogScale: true },
		enableXMinMax: true,
		enableYMinMax: true,
		loadingStatusKeys: ['rawBackgroundIsLoading', 'fitInitIsLoading', 'repInitLoading', 'tcFitsIsLoading'],
		series: FIT_CUM_CHART_SERIES,
		title: 'Rate vs Cumulative',
		tooltip: 'Plot Rate vs Cumulative value of current phase',
		yMaxItems: forecastMinMaxArrToMenuItems([100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 'all']),
	},
	c4: {
		defaultActiveSeries: Object.keys(_.omit(C4_CHART_SERIES, ['overlayForecast'])),
		defaultChartSettings: { ...DEFAULT_MIN_MAX, xAxis: 'time', yLogScale: true },
		enableXMinMax: true,
		enableYMinMax: true,
		loadingStatusKeys: ['rawBackgroundIsLoading', 'fitInitIsLoading', 'repInitLoading', 'tcFitsIsLoading'],
		series: C4_CHART_SERIES,
		title: 'Type Curve Fit',
		tooltip: 'A spaghetti chart for the representative data',
		yMaxItems: forecastMinMaxArrToMenuItems([100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 'all']),
	},
	threePhaseFit: {
		defaultActiveSeries: ['best'],
		defaultChartSettings: { ...DEFAULT_MIN_MAX, yLogScale: true, xAxis: 'time' },
		enableXMinMax: true,
		enableYMinMax: true,
		loadingStatusKeys: ['fitInitIsLoading', 'tcFitsIsLoading'],
		series: THREE_PHASE_FIT_SERIES,
		title: 'Three Phase Fit',
		yMaxItems: forecastMinMaxArrToMenuItems([100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 'all']),
	},
	eur: {
		defaultActiveSeries: Object.keys(EUR_CHART_SERIES),
		defaultChartSettings: { ...DEFAULT_MIN_MAX, xAxis: 'relativeTime', yLogScale: true },
		enableXMinMax: false,
		enableYMinMax: true,
		loadingStatusKeys: ['rawBackgroundIsLoading', 'fitInitIsLoading', 'repInitLoading', 'tcFitsIsLoading'],
		series: EUR_CHART_SERIES,
		title: 'EUR Distribution',
		tooltip: 'Plot of the type curve wells’ percentile ranking vs EUR & the Fit Series overlay',
		yMaxItems: forecastMinMaxArrToMenuItems([100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 'all']),
	},
	ip: {
		defaultActiveSeries: Object.keys(IP_CHART_SERIES),
		defaultChartSettings: { ...DEFAULT_MIN_MAX, xAxis: 'relativeTime', yLogScale: true },
		enableXMinMax: false,
		enableYMinMax: true,
		loadingStatusKeys: ['rawBackgroundIsLoading', 'fitInitIsLoading', 'repInitLoading', 'tcFitsIsLoading'],
		series: IP_CHART_SERIES,
		title: 'Peak Rate Distribution',
		yMaxItems: forecastMinMaxArrToMenuItems([
			100,
			200,
			500,
			1_000,
			2_000,
			5_000,
			10_000,
			20_000,
			50_000,
			100_000,
			'all',
		]),
		tooltip: 'Plot of the type curve wells’ percentile ranking vs Peak Rate & the Fit Series overlay',
	},
	crossplot: {
		defaultChartSettings: { ...DEFAULT_MIN_MAX, xAxis: 'relativeTime', yLogScale: false },
		enableYMinMax: true,
		loadingStatusKeys: ['repInitLoading'],
		title: 'Cross Plot',
		tooltip:
			'X-Y Cross Plot of well, completion & performance data for type curve wells. Click the gear icon to change the plot parameters',
	},
	paramsTable: {
		defaultChartSettings: { xAxis: 'time' },
		loadingStatusKeys: ['rawBackgroundIsLoading', 'fitInitIsLoading', 'repInitLoading', 'tcFitsIsLoading'],
		title: 'Parameters Table',
		tooltip: 'Displays The Fit Parameters In A Tabular Format',
	},
	map: {
		loadingStatusKeys: ['repInitLoading'],
		title: 'Map',
		tooltip: 'Map of wells used in the type curves. Zoom in for wellbore sticks',
	},
	probit: {
		defaultActiveSeries: ['wellsEur'],
		defaultChartSettings: { xAxis: 'probit_eur', cumMin: 'all', cumMax: 'all' },
		enableXMinMax: true,
		loadingStatusKeys: ['rawBackgroundIsLoading', 'fitInitIsLoading', 'repInitLoading', 'tcFitsIsLoading'],
		title: 'Probit Plot',
		tooltip: 'Plot of the cumulative probability of representative well EURs.',
		// maybe there are better values as options
		xMaxItems: forecastMinMaxArrToMenuItems([100, 500, 1000, 2500, 'all']),
		xMinItems: forecastMinMaxArrToMenuItems([1, 10, 50, 'all']),
	},
};

const SHOW_DAILY_KEYS: Array<ViewerOptions> = ['fitCum', 'c4'];

const getChartViewerTypeMenuItems = (viewerTypes) =>
	_.map(viewerTypes, (value, key) => ({
		label: <InfoTooltipWrapper tooltipTitle={value.tooltip}>{value.title}</InfoTooltipWrapper>,
		value: key,
	})) as Array<{ label: string | JSX.Element; value: ViewerOptions }>;

const chartViewerTypeMenuItems = getChartViewerTypeMenuItems(chartViewerTypes);

const normalizationChartViewerTypes: Record<NormalizationViewerOptions, ChartViewerType> = {
	linearFit: {
		defaultChartSettings: { ...DEFAULT_NORMALIZATION_CHART_SETTINGS },
		enableXMinMax: true,
		enableYMinMax: true,
		loadingStatusKeys: ['eurDataIsLoading', 'headersMapIsLoading', 'basesIsLoading'],
		title: 'EUR Normalization',
		xMaxItems: DEFAULT_NORMALIZATION_X_MAX_ITEMS,
		xMinItems: DEFAULT_NORMALIZATION_X_MIN_ITEMS,
	},
	qPeakLinearFit: {
		defaultChartSettings: { ...DEFAULT_NORMALIZATION_CHART_SETTINGS },
		enableXMinMax: true,
		enableYMinMax: true,
		loadingStatusKeys: ['headersMapIsLoading', 'basesIsLoading'],
		title: 'Peak Rate Normalization',
		xMaxItems: DEFAULT_NORMALIZATION_X_MAX_ITEMS,
		xMinItems: DEFAULT_NORMALIZATION_X_MIN_ITEMS,
	},
	normalizationMultipliersTable: {
		title: 'Multipliers Table',
		loadingStatusKeys: ['eurDataIsLoading', 'headersMapIsLoading', 'basesIsLoading'],
	},
};

const normalizationChartViewerTypeMenuItems = getChartViewerTypeMenuItems(normalizationChartViewerTypes);

const proximityChartViewerTypes = {
	c4: {
		title: 'Type Curve Fit',
		enableYMinMax: true,
		enableXMinMax: true,
		series: _.pickBy(C4_CHART_SERIES, (_, key) => !PROX_EXCLUDE_KEYS.includes(key)),
		defaultActiveSeries: Object.keys(C4_CHART_SERIES).filter((key) => !PROX_EXCLUDE_KEYS.includes(key)),
		defaultChartSettings: { ...DEFAULT_MIN_MAX },
		yMaxItems: forecastMinMaxArrToMenuItems([100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 'all']),
		tooltip: 'A spaghetti chart for the representative data',
	},
	eur: {
		title: 'EUR Distribution',
		enableYMinMax: true,
		enableXMinMax: false,
		series: _.pickBy(EUR_CHART_SERIES, (_, key) => !PROX_EXCLUDE_KEYS.includes(key)),
		defaultActiveSeries: Object.keys(EUR_CHART_SERIES).filter((key) => !PROX_EXCLUDE_KEYS.includes(key)),
		defaultChartSettings: { ...DEFAULT_MIN_MAX },
		yMaxItems: forecastMinMaxArrToMenuItems([100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 'all']),
		tooltip: 'Plot of the proximity wells percentile ranking vs EUR & the Fit Series overlay',
	},
	table: {
		title: 'Well Table',
		defaultChartSettings: {},
		tooltip: 'List of proximity wells',
	},
	map: {
		title: 'Map',
		tooltip: 'Map of proximity wells. Zoom in for wellbore sticks',
	},
	linearFit: {
		title: 'Normalization Chart',
		tooltip: 'Normalization fit chart',
	},
	probit: {
		title: 'Probit Plot ',
		tooltip: 'Plot of the cumulative probability of representative well EURs.',
		enableXMinMax: true,
		defaultActiveSeries: ['wellsEur'],
		defaultChartSettings: { xAxis: 'probit_eur', cumMin: 'all', cumMax: 'all' },
		// maybe there are better values as options
		xMaxItems: forecastMinMaxArrToMenuItems([100, 500, 1000, 2500, 'all']),
		xMinItems: forecastMinMaxArrToMenuItems([1, 10, 50, 'all']),
	},
	paramsTable: {
		title: 'Parameters Table',
		defaultChartSettings: {},
		tooltip: 'Displays The Fit Parameters In A Tabular Format',
	},
};

const proximityViewerMenuOptions = getChartViewerTypeMenuItems(proximityChartViewerTypes);

const C4_CONFIGURATION_KEY = 'c4';

const DEFAULT_C4_CONFIG = {
	[C4_CONFIGURATION_KEY]: {
		c4Legend: {
			dataSeries: [...C4_DATA_SERIES],
			fitSeries: [...FIT_SERIES],
		},
		c4ShowDaily: true,
		overlayForecast: true,
		showBackground: true,
	},
};

const getDefaultCrossPlot = (phase) => ({ x: 'perf_lateral_length', y: `${phase}_eur` });

const DEFAULT_CROSS_PLOT = { x: 'perf_lateral_length', y: '$EUR' };

const DEFAULT_DAILY = true;

const DEFAULT_AGGREGATION_HONOR = true;

const DEFAULT_BG_WELLS_HONOR = true;

const DEFAULT_C4_RATIO_SHOW_RATE = false;

const DEFAULT_FIT_VIEWER_CONFIG = {
	c4: { activeChartSeries: cloneDeep(chartViewerTypes.c4.defaultActiveSeries), showDaily: DEFAULT_DAILY },
	crossplot: { crossplot: { ...DEFAULT_CROSS_PLOT } },
	cum: { activeChartSeries: cloneDeep(chartViewerTypes.cum.defaultActiveSeries) },
	eur: { activeChartSeries: cloneDeep(chartViewerTypes.eur.defaultActiveSeries) },
	fitCum: { activeChartSeries: cloneDeep(chartViewerTypes.fitCum.defaultActiveSeries), showDaily: DEFAULT_DAILY },
	ip: { activeChartSeries: cloneDeep(chartViewerTypes.ip.defaultActiveSeries) },
	sum: { activeChartSeries: cloneDeep(chartViewerTypes.sum.defaultActiveSeries) },
};

export {
	C4_CONFIGURATION_KEY,
	ChartViewerType,
	chartViewerTypeMenuItems,
	chartViewerTypes,
	COLOR_BY_CHART_TYPES,
	CUM_CHART_SERIES,
	DEFAULT_AGGREGATION_HONOR,
	DEFAULT_BG_WELLS_HONOR,
	DEFAULT_C4_CONFIG,
	DEFAULT_C4_RATIO_SHOW_RATE,
	DEFAULT_CROSS_PLOT,
	DEFAULT_DAILY,
	DEFAULT_FIT_VIEWER_CONFIG,
	DEFAULT_GRID_CHART_SELECTION,
	DEFAULT_MIN_MAX,
	EUR_CHART_SERIES,
	EXCLUDE_SETTINGS_CHART_TYPES,
	FIT_CUM_CHART_SERIES,
	FIT_OBJECT,
	getAveragePercentile,
	getDefaultCrossPlot,
	getMaxProdTime,
	getPNumTimeArr,
	INIT_VIEWER_KEYS,
	IP_CHART_SERIES,
	LoadingKey,
	LoadingStatuses,
	normalizationChartViewerTypeMenuItems,
	normalizationChartViewerTypes,
	NormalizationViewerOptions,
	NUMERICAL_P_VALUES,
	proximityChartViewerTypes,
	proximityViewerMenuOptions,
	SHOW_DAILY_KEYS,
	SUM_CHART_SERIES,
	viewerOptions,
	ViewerOptions,
	ViewerType,
	WELLS_P_OBJECT,
};
