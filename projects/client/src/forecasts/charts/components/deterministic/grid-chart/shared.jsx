import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { DEFAULT_FORECAST_MENU_VALUES } from '@/forecasts/shared/index';

const DEFAULT_GRAPH_SETTINGS = {
	disablePadding: true,
	enableAlign: false,
	enableDailyOperations: false,
	enableLegend: true,
	enableMonthlyOperations: false,
	enablePll: false,
	enableVerticalControls: true,
	lineScatter: true,
	numOfCharts: 4,
	proximityColorSeries: true,
	unitResolution: 'daily',
	xLogScale: false,
	xPadding: 10,
	yLogScale: true,
	yMax: 10000,
	yMaxPadding: 10,
	yMin: 0.1,
	yPadding: 10,
	...DEFAULT_FORECAST_MENU_VALUES,
};

const DEFAULT_DATA_SETTINGS = {
	xAxis: 'time',
	daily: new Set(),
	forecast: new Set(VALID_PHASES),
	monthly: new Set(VALID_PHASES),
};

const DEFAULT_FILTER_BODY = {
	forecastType: [],
	status: [],
	wellName: '',
	warning: null,
};

const generateConfigBody = (dataSettings, graphSettings) => {
	const { daily, forecast, monthly } = dataSettings;
	return {
		dataSettings: { ...dataSettings, daily: [...daily], forecast: [...forecast], monthly: [...monthly] },
		graphSettings: { ...graphSettings },
	};
};

const getSwIndexes = (timeArr, segments) =>
	segments
		.filter(
			(segment) => segment?.sw_idx && segment.sw_idx <= segment.end_idx && segment.sw_idx >= segment.start_idx
		)
		.map((segment) => {
			return timeArr.findIndex((idx) => idx === parseInt(segment.sw_idx, 10));
		});

const getMarkerIndexes = (timeArr, segments) =>
	segments.slice(1).map((segment) => timeArr.findIndex((idx) => idx === segment.start_idx));

export {
	DEFAULT_FILTER_BODY,
	DEFAULT_DATA_SETTINGS,
	DEFAULT_GRAPH_SETTINGS,
	generateConfigBody,
	getSwIndexes,
	getMarkerIndexes,
};
