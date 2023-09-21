import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import {
	CUMSUM_GAS_COLOR,
	CUMSUM_OIL_COLOR,
	CUMSUM_WATER_COLOR,
	customFieldColors,
	lineSeriesConfig,
	otherFieldsColors,
	pressureColors,
	scatterSeriesConfig,
} from '@/helpers/zing';

/**
 * Time Unit Conversions
 *
 * @description: Although other libraries may have these, we may adjust the definition of days in year / month
 * based on forecasting needs
 */

export const daysToYears = (days) => days / 365;
export const monthsToYears = (months) => months / 12;
export const yearsToDays = (years) => years * 365;
export const yearsToMonths = (years) => years * 12;

const DAILY_GAS_COLOR = 'rgba(255, 0, 0, 1)';
const DAILY_OIL_COLOR = 'rgba(0, 176, 80, 1)';
const DAILY_WATER_COLOR = 'rgba(0, 122, 192, 1)';

const DAILY_GAS_OIL_RATIO_COLOR = 'rgba(192,0,0,1)';
const DAILY_GAS_WATER_RATIO_COLOR = 'rgba(197,19,19,1)';
const DAILY_OIL_GAS_RATIO_COLOR = 'rgba(79,98,40,1)';
const DAILY_OIL_WATER_RATIO_COLOR = 'rgba(79,98,40,1)';
const DAILY_WATER_GAS_RATIO_COLOR = 'rgba(23,183,241,1)';
const DAILY_WATER_OIL_RATIO_COLOR = 'rgba(104,208,246,1)';

const DAILY_PRODUCTION_COLORS = {
	gas: DAILY_GAS_COLOR,
	oil: DAILY_OIL_COLOR,
	water: DAILY_WATER_COLOR,
};

const DAILY_RATIO_COLORS = {
	'gas/oil': DAILY_GAS_OIL_RATIO_COLOR,
	'gas/water': DAILY_GAS_WATER_RATIO_COLOR,
	'oil/gas': DAILY_OIL_GAS_RATIO_COLOR,
	'oil/water': DAILY_OIL_WATER_RATIO_COLOR,
	'water/gas': DAILY_WATER_GAS_RATIO_COLOR,
	'water/oil': DAILY_WATER_OIL_RATIO_COLOR,
};

const MONTHLY_GAS_COLOR = 'rgba(192, 0, 0, 1)';
const MONTHLY_OIL_COLOR = 'rgba(9, 109, 28, 1)';
const MONTHLY_WATER_COLOR = 'rgba(23, 6, 250, 1)';

const MONTHLY_GAS_OIL_RATIO_COLOR = 'rgba(192,0,0,1)';
const MONTHLY_GAS_WATER_RATIO_COLOR = 'rgba(192,0,0,1)';
const MONTHLY_OIL_GAS_RATIO_COLOR = 'rgba(79,98,40,1)';
const MONTHLY_OIL_WATER_RATIO_COLOR = 'rgba(80,99,42,1)';
const MONTHLY_WATER_GAS_RATIO_COLOR = 'rgba(53,192,243,1)';
const MONTHLY_WATER_OIL_RATIO_COLOR = 'rgba(0,176,240,1)';

const MONTHLY_PRODUCTION_COLORS = {
	gas: MONTHLY_GAS_COLOR,
	oil: MONTHLY_OIL_COLOR,
	water: MONTHLY_WATER_COLOR,
};

const MONTHLY_RATIO_COLORS = {
	'gas/oil': MONTHLY_GAS_OIL_RATIO_COLOR,
	'gas/water': MONTHLY_GAS_WATER_RATIO_COLOR,
	'oil/gas': MONTHLY_OIL_GAS_RATIO_COLOR,
	'oil/water': MONTHLY_OIL_WATER_RATIO_COLOR,
	'water/gas': MONTHLY_WATER_GAS_RATIO_COLOR,
	'water/oil': MONTHLY_WATER_OIL_RATIO_COLOR,
};

const FORECAST_GAS_COLOR = 'rgba(251, 99, 87, 1)';
const FORECAST_OIL_COLOR = 'rgba(19, 231, 115, 1)';
const FORECAST_WATER_COLOR = 'rgba(110, 149, 196, 1)';

const FORECAST_GAS_OIL_RATIO_COLOR = 'rgba(254,4,4,1)';
const FORECAST_GAS_WATER_RATIO_COLOR = 'rgba(254,4,4,1)';
const FORECAST_OIL_GAS_RATIO_COLOR = 'rgba(127,153,71,1)';
const FORECAST_OIL_WATER_RATIO_COLOR = 'rgba(127,153,71,1)';
const FORECAST_WATER_GAS_RATIO_COLOR = 'rgba(33,232,237,1)';
const FORECAST_WATER_OIL_RATIO_COLOR = 'rgba(33,232,237,1)';

const FORECAST_PRODUCTION_COLORS = {
	gas: FORECAST_GAS_COLOR,
	oil: FORECAST_OIL_COLOR,
	water: FORECAST_WATER_COLOR,
};

const FORECAST_RATIO_COLORS = {
	'gas/oil': FORECAST_GAS_OIL_RATIO_COLOR,
	'gas/water': FORECAST_GAS_WATER_RATIO_COLOR,
	'oil/gas': FORECAST_OIL_GAS_RATIO_COLOR,
	'oil/water': FORECAST_OIL_WATER_RATIO_COLOR,
	'water/gas': FORECAST_WATER_GAS_RATIO_COLOR,
	'water/oil': FORECAST_WATER_OIL_RATIO_COLOR,
};

const COLLECTION_SERIES_TYPES = {
	daily: scatterSeriesConfig,
	forecast: lineSeriesConfig,
	monthly: scatterSeriesConfig,
};

const COLLECTION_SHORT_LABELS = {
	monthly: 'M',
	daily: 'D',
	forecast: 'F',
};

const PHASE_SHORT_LABELS = {
	oil: 'O',
	gas: 'G',
	water: 'W',
};

const CUMSUM_SERIES_TYPE = lineSeriesConfig;
const FORECAST_SERIES_TYPE = lineSeriesConfig;
const PRESSURE_SERIES_TYPE = lineSeriesConfig;
const PRODUCTION_SERIES_TYPE = lineSeriesConfig;
const RATIO_SERIES_TYPE = lineSeriesConfig;
const OTHER_FIELDS_SERIES_TYPE = lineSeriesConfig;

const MONTHLY_CUMSUM_SERIES_PROPS = { lineWidth: 3 };
const MONTHLY_PRODUCTION_SERIES_PROPS = {
	lineWidth: 3,
	markerType: 'triangle',
	markerSize: 4,
	size: 3,
	showMarkers: true,
};
const MONTHLY_RATIO_SERIES_PROPS = { lineWidth: 3 };
const MONTHLY_OTHER_FIELDS_SERIES_PROPS = { lineWidth: 3 };

const DAILY_CUMSUM_SERIES_PROPS = { lineWidth: 2 };
const DAILY_PRESSURE_SERIES_PROPS = { lineWidth: 2 };
const DAILY_PRODUCTION_SERIES_PROPS = { lineWidth: 2, markerType: 'circle', markerSize: 2, size: 2, showMarkers: true };
const DAILY_RATIO_SERIES_PROPS = { lineWidth: 2 };
const DAILY_OTHER_FIELDS_SERIES_PROPS = { lineWidth: 2 };

const PRODUCTION_MBT_SERIES_PROPS = {
	lineStyle: 'dashed',
	markerType: 'square',
	showMarkers: true,
};

const FORECAST_MBT_SERIES_PROPS = {
	lineStyle: 'dashed',
};

const Y_ITEM_SERIES_TYPES = {
	monthly: {
		cumsum: { type: CUMSUM_SERIES_TYPE, props: MONTHLY_CUMSUM_SERIES_PROPS },
		production: { type: PRODUCTION_SERIES_TYPE, props: MONTHLY_PRODUCTION_SERIES_PROPS },
		ratio: { type: RATIO_SERIES_TYPE, props: MONTHLY_RATIO_SERIES_PROPS },
		other: { type: OTHER_FIELDS_SERIES_TYPE, props: MONTHLY_OTHER_FIELDS_SERIES_PROPS },
		mbt: { type: scatterSeriesConfig, props: PRODUCTION_MBT_SERIES_PROPS },
	},
	daily: {
		cumsum: { type: CUMSUM_SERIES_TYPE, props: DAILY_CUMSUM_SERIES_PROPS },
		pressure: { type: PRESSURE_SERIES_TYPE, props: DAILY_PRESSURE_SERIES_PROPS },
		production: { type: PRODUCTION_SERIES_TYPE, props: DAILY_PRODUCTION_SERIES_PROPS },
		ratio: { type: RATIO_SERIES_TYPE, props: DAILY_RATIO_SERIES_PROPS },
		other: { type: OTHER_FIELDS_SERIES_TYPE, props: DAILY_OTHER_FIELDS_SERIES_PROPS },
		mbt: { type: scatterSeriesConfig, props: PRODUCTION_MBT_SERIES_PROPS },
	},
	forecast: {
		cumsum: { type: FORECAST_SERIES_TYPE, props: MONTHLY_CUMSUM_SERIES_PROPS },
		production: { type: FORECAST_SERIES_TYPE, props: MONTHLY_RATIO_SERIES_PROPS },
		ratio: { type: FORECAST_SERIES_TYPE, props: MONTHLY_RATIO_SERIES_PROPS },
		mbt: { type: lineSeriesConfig, props: FORECAST_MBT_SERIES_PROPS },
	},
};

const Y_ITEM_SHAPES = {
	'gas/oil': 'square',
	'gas/water': 'square',
	'oil/gas': 'square',
	'oil/water': 'square',
	'water/gas': 'square',
	'water/oil': 'square',
	cumsum_gas: 'triangle',
	cumsum_oil: 'triangle',
	cumsum_water: 'triangle',
	gas: 'circle',
	oil: 'circle',
	water: 'circle',

	mbt_gas: 'square',
	mbt_oil: 'square',
	mbt_water: 'square',
	mbt_gas_filtered: 'square',
	mbt_oil_filtered: 'square',
	mbt_water_filtered: 'square',
};

const Y_ITEM_COLORS = {
	daily: {
		...DAILY_PRODUCTION_COLORS,
		...DAILY_RATIO_COLORS,
		...pressureColors,
		...otherFieldsColors,
		...customFieldColors,
		cumsum_gas: CUMSUM_GAS_COLOR,
		cumsum_oil: CUMSUM_OIL_COLOR,
		cumsum_water: CUMSUM_WATER_COLOR,
	},
	monthly: {
		...MONTHLY_PRODUCTION_COLORS,
		...MONTHLY_RATIO_COLORS,
		...otherFieldsColors,
		...customFieldColors,
		cumsum_gas: CUMSUM_GAS_COLOR,
		cumsum_oil: CUMSUM_OIL_COLOR,
		cumsum_water: CUMSUM_WATER_COLOR,
	},
	forecast: {
		...FORECAST_PRODUCTION_COLORS,
		...FORECAST_RATIO_COLORS,
		cumsum_gas: CUMSUM_GAS_COLOR,
		cumsum_oil: CUMSUM_OIL_COLOR,
		cumsum_water: CUMSUM_WATER_COLOR,
	},
	proximityWells: {
		gas: '#A57E7E',
		oil: '#75C07A',
		water: '#5DA8C1',
	},
};

const VALID_PHASES: Array<Phase> = ['oil', 'gas', 'water'];

const VALID_PRESSURES = [
	'bottom_hole_pressure',
	'casing_head_pressure',
	'flowline_pressure',
	'gas_lift_injection_pressure',
	'tubing_head_pressure',
	'vessel_separator_pressure',
];

const VALID_OTHER_FIELDS = ['gasInjection', 'waterInjection', 'co2Injection', 'steamInjection', 'ngl'];

const VALID_BASE_CUSTOM_FIELDS = ['customNumber0', 'customNumber1', 'customNumber2', 'customNumber3', 'customNumber4'];

const VALID_MONTHLY_CUSTOM_FIELDS = VALID_BASE_CUSTOM_FIELDS.map((field) => `${field}Monthly`);

const VALID_DAILY_CUSTOM_FIELDS = VALID_BASE_CUSTOM_FIELDS.map((field) => `${field}Daily`);

const VALID_CUMS = ['cumsum_oil', 'cumsum_gas', 'cumsum_water'];

const VALID_MBT = ['mbt', 'mbt_filtered'];

const VALID_NUMERIC = [...VALID_CUMS, ...VALID_MBT, 'probit_eur'];

const VALID_RATIOS = ['oil/gas', 'oil/water', 'gas/oil', 'gas/water', 'water/oil', 'water/gas'];

const VALID_COLUMNS = [...VALID_PHASES, ...VALID_RATIOS, ...VALID_PRESSURES];

const VALID_PLL_SERIES = [...VALID_PHASES, ...VALID_CUMS];

const getYType = (yValue) => {
	const allYTypes = [
		...VALID_PHASES,
		...VALID_CUMS,
		...VALID_RATIOS,
		...VALID_PRESSURES,
		...VALID_OTHER_FIELDS,
		...VALID_MONTHLY_CUSTOM_FIELDS,
		...VALID_DAILY_CUSTOM_FIELDS,
	];
	const index = allYTypes.findIndex((val) => val === yValue);
	const phaseIdx = VALID_PHASES.length;
	const cumIdx = VALID_CUMS.length + phaseIdx;
	const ratioIdx = VALID_RATIOS.length + cumIdx;
	const pressureIdx = VALID_PRESSURES.length + ratioIdx;

	if (index < 0) {
		throw new Error('Invalid y-axis value');
	}
	if (index < phaseIdx) {
		return 'production';
	}
	if (index < cumIdx) {
		return 'cumsum';
	}
	if (index < ratioIdx) {
		return 'ratio';
	}
	if (index < pressureIdx) {
		return 'pressure';
	}

	return 'other';
};

const COLUMN_LABELS = {
	'gas/oil': 'Gas / Oil',
	'gas/water': 'Gas / Water',
	'oil/gas': 'Oil / Gas',
	'oil/water': 'Oil / Water',
	'water/gas': 'Water / Gas',
	'water/oil': 'Water / Oil',
	bottom_hole_pressure: 'Bottom Hole Pressure',
	casing_head_pressure: 'Casing Head Pressure',
	cumsum_gas: 'Cum Gas',
	cumsum_oil: 'Cum Oil',
	cumsum_water: 'Cum Water',
	// XXX: The 'mbt' names (and most likely other names in this object) are
	// slightly error prone as the are duplicated in
	// client/src/forecasts/shared/ForecastMenuItems.tsx:xAxisItems <28-01-22,
	// Max Schulte> //
	mbt_oil: 'Oil Material Balance Time',
	mbt_gas: 'Gas Material Balance Time',
	mbt_water: 'Water Material Balance Time',
	mbt_oil_filtered: 'Oil Material Balance Time (Filtered)',
	mbt_gas_filtered: 'Gas Material Balance Time (Filtered)',
	mbt_water_filtered: 'Water Material Balance Time (Filtered)',
	flowline_pressure: 'Flowline Pressure',
	gas_lift_injection_pressure: 'Gas Lift Injection Pressure',
	gas: 'Gas',
	oil: 'Oil',
	tubing_head_pressure: 'Tubing Head Pressure',
	vessel_separator_pressure: 'Vessel Separator Pressure',
	relativeTime: 'Relative Time',
	time: 'Time',
	water: 'Water',
	gasInjection: 'Gas Injection',
	waterInjection: 'Water Injection',
	co2Injection: 'CO2 Injection',
	steamInjection: 'Steam Injection',
	ngl: 'NGL',
	customNumber0Monthly: 'Custom Monthly Number 0',
	customNumber1Monthly: 'Custom Monthly Number 1',
	customNumber2Monthly: 'Custom Monthly Number 2',
	customNumber3Monthly: 'Custom Monthly Number 3',
	customNumber4Monthly: 'Custom Monthly Number 4',
	customNumber0Daily: 'Custom Daily Number 0',
	customNumber1Daily: 'Custom Daily Number 1',
	customNumber2Daily: 'Custom Daily Number 2',
	customNumber3Daily: 'Custom Daily Number 3',
	customNumber4Daily: 'Custom Daily Number 4',
};

const LEGEND_LABELS = {
	'gas/oil': 'G/O',
	'gas/water': 'G/W',
	'oil/gas': 'O/G',
	'oil/water': 'O/W',
	'water/gas': 'W/G',
	'water/oil': 'W/O',
	bottom_hole_pressure: 'BHP',
	casing_head_pressure: 'CsgP',
	cumsum_gas: 'Cum G',
	cumsum_oil: 'Cum O',
	cumsum_water: 'Cum W',
	flowline_pressure: 'FLP',
	gas_lift_injection_pressure: 'GLP',
	gas: 'G',
	oil: 'O',
	tubing_head_pressure: 'THP',
	vessel_separator_pressure: 'VSP',
	relativeTime: 'Relative Time',
	time: 'Time',
	water: 'W',
	gasInjection: 'G Inj',
	waterInjection: 'W Inj',
	co2Injection: 'CO2 Inj',
	steamInjection: 'Steam Inj',
	ngl: 'NGL',
};

interface ListItem {
	value: string;
	label: string;
}

type ChartDateType = 'absolute' | 'relative';

const TIME_X_AXIS_ITEM = { value: 'time', label: 'Time' };
const RELATIVE_TIME_X_AXIS_ITEM = { value: 'relativeTime', label: 'Relative Time' };

// getNumericXAxisItems maps columns labels (so far this is only used on the
// valid phases of oil, water, and gas) to xAxisItems.
const getNumericXAxisItems = (phasesList, phaseMapper = (phase: string) => `cumsum_${phase}`) =>
	phasesList.map((phase) => {
		const value = phaseMapper(phase);
		return { value, label: COLUMN_LABELS[value] };
	});

const X_AXIS_PROXIMITY_ITEMS = [TIME_X_AXIS_ITEM];

const X_AXIS_COMPARISON_ITEMS = [TIME_X_AXIS_ITEM, RELATIVE_TIME_X_AXIS_ITEM];

const EXCLUDE_MBT_X_AXIS_ITEMS = [...X_AXIS_COMPARISON_ITEMS, ...getNumericXAxisItems(VALID_PHASES)];

const X_AXIS_ITEMS = [
	...X_AXIS_COMPARISON_ITEMS,
	...getNumericXAxisItems(VALID_PHASES),
	// ...getNumericXAxisItems(VALID_PHASES, (phase: String) => `mbt_${phase}`),
	// ...getNumericXAxisItems(VALID_PHASES, (phase: String) => `mbt_${phase}_filtered`),
	{ value: 'mbt', label: 'Material Balance Time' },
	{ value: 'mbt_filtered', label: 'Material Balance Time (Filtered)' },
];

const MONTHLY_ITEMS = [
	...VALID_PHASES,
	...VALID_CUMS,
	...VALID_RATIOS,
	...VALID_OTHER_FIELDS,
	...VALID_MONTHLY_CUSTOM_FIELDS,
].map((value) => ({
	value,
	label: COLUMN_LABELS[value],
}));

const DAILY_ITEMS = [
	...VALID_PHASES,
	...VALID_CUMS,
	...VALID_RATIOS,
	...VALID_PRESSURES,
	...VALID_OTHER_FIELDS,
	...VALID_DAILY_CUSTOM_FIELDS,
].map((value) => ({
	value,
	label: COLUMN_LABELS[value],
}));

const FORECAST_ITEMS = [...VALID_PHASES, ...VALID_CUMS, ...VALID_RATIOS].map((value) => ({
	value,
	label: COLUMN_LABELS[value],
}));

const ALL_ITEMS_ARR = [
	...VALID_PHASES,
	...VALID_CUMS,
	...VALID_RATIOS,
	...VALID_PRESSURES,
	...VALID_OTHER_FIELDS,
	...VALID_MONTHLY_CUSTOM_FIELDS,
	...VALID_DAILY_CUSTOM_FIELDS,
];

const ALL_ITEMS_WITH_LABEL = ALL_ITEMS_ARR.map((value) => ({ value, label: COLUMN_LABELS[value] }));

const COLLECTIONS = {
	view: {
		xAxis: X_AXIS_ITEMS,
		monthly: MONTHLY_ITEMS,
		daily: DAILY_ITEMS,
		forecast: FORECAST_ITEMS,
	},
	comparison: {
		xAxis: X_AXIS_COMPARISON_ITEMS,
		monthly: MONTHLY_ITEMS,
		daily: DAILY_ITEMS,
		forecast: FORECAST_ITEMS,
	},
};

const DEFAULT_CHART_WELL_HEADERS = [
	'well_name',
	'well_number',
	'current_operator_alias',
	'landing_zone',
	'perf_lateral_length',
	'total_proppant_per_perforated_interval',
];

const CALCULATED_WELL_HEADERS = [
	'perf_lateral_length',
	'total_proppant_per_perforated_interval',
	'total_fluid_per_perforated_interval',
];

const EXTENDED_WELL_HEADERS = [
	'well_number',
	'api14',
	'first_prod_date_monthly_calc',
	'current_operator_alias',
	'landing_zone',
	'county',
];

const LIMITED_EXTENDED_WELL_HEADERS = ['well_number'];

const LIMITED_CALCULATED_WELL_HEADERS = ['perf_lateral_length', 'total_proppant_per_perforated_interval'];

const CHART_RESOLUTION_ITEMS = [
	{ label: 'Monthly', value: 'monthly' },
	{ label: 'Daily', value: 'daily' },
];

const DEFAULT_SERIES_ITEMS = [
	{ x: 'time', y: 'oil', collection: 'monthly' },
	{ x: 'time', y: 'gas', collection: 'monthly' },
	{ x: 'time', y: 'water', collection: 'monthly' },
	{ x: 'time', y: 'oil', collection: 'forecast' },
	{ x: 'time', y: 'gas', collection: 'forecast' },
	{ x: 'time', y: 'water', collection: 'forecast' },
];

const DEFAULT_STATUS_OBJ = { oil: 'in_progress', gas: 'in_progress', water: 'in_progress' };

// TODO: stand-in conversion object; requires some further discussion for future implementation; will be added as template later on
const GRAPH_MONTHLY_UNIT_RESOLUTION = {
	'gas/oil': 'CF/BBL',
	'gas/water': 'MCF/BBL',
	'oil/gas': 'BBL/MMCF',
	'oil/water': 'BBL/BBL',
	'water/gas': 'BBL/MMCF',
	'water/oil': 'BBL/BBL',

	'gas/oil/pll': 'MCF/BBL/FT',
	'gas/water/pll': 'MCF/BBL/FT',
	'oil/gas/pll': 'BBL/MCF/FT',
	'oil/water/pll': 'BBL/BBL/FT',
	'water/gas/pll': 'BBL/MCF/FT',
	'water/oil/pll': 'BBL/BBL/FT',

	cumsum_gas: 'MMCF',
	cumsum_oil: 'MBBL',
	cumsum_water: 'MBBL',

	'cumsum_gas/pll': 'MCF/FT',
	'cumsum_oil/pll': 'BBL/FT',
	'cumsum_water/pll': 'BBL/FT',

	gas: 'MCF/M',
	oil: 'BBL/M',
	water: 'BBL/M',

	'gas/pll': 'MCF/M/FT',
	'oil/pll': 'BBL/M/FT',
	'water/pll': 'BBL/M/FT',

	bottom_hole_pressure: 'PSI',
	casing_head_pressure: 'PSI',
	flowline_pressure: 'PSI',
	gas_lift_injection_pressure: 'PSI',
	tubing_head_pressure: 'PSI',
	vessel_separator_pressure: 'PSI',

	pll: 'FT',

	gas_eur: 'MCF',
	'gas_eur/pll': 'MCF/FT',
	oil_eur: 'BBL',
	'oil_eur/pll': 'BBL/FT',
	water_eur: 'BBL',
	'water_eur/pll': 'BBL/FT',

	oil_k: 'BBL/D/D',
	gas_k: 'MCF/D/D',
	water_k: 'BBL/D/D',

	'gas/oil_k': 'MCF/BBL/D',
	'gas/water_k': 'MCF/BBL/D',
	'oil/gas_k': 'BBL/MCF/D',
	'oil/water_k': 'BBL/BBL/D',
	'water/gas_k': 'BBL/MCF/D',
	'water/oil_k': 'BBL/BBL/D',
};

const TC_SHORT_Y_LABEL_CHARS = 8;

export {
	ALL_ITEMS_ARR,
	ALL_ITEMS_WITH_LABEL,
	CALCULATED_WELL_HEADERS,
	CHART_RESOLUTION_ITEMS,
	ChartDateType,
	COLLECTIONS,
	COLLECTION_SERIES_TYPES,
	COLLECTION_SHORT_LABELS,
	COLUMN_LABELS,
	DAILY_ITEMS,
	DAILY_PRODUCTION_COLORS,
	DAILY_RATIO_COLORS,
	DEFAULT_CHART_WELL_HEADERS,
	DEFAULT_SERIES_ITEMS,
	DEFAULT_STATUS_OBJ,
	EXCLUDE_MBT_X_AXIS_ITEMS,
	EXTENDED_WELL_HEADERS,
	FORECAST_ITEMS,
	FORECAST_PRODUCTION_COLORS,
	getNumericXAxisItems,
	getYType,
	GRAPH_MONTHLY_UNIT_RESOLUTION,
	LEGEND_LABELS,
	LIMITED_CALCULATED_WELL_HEADERS,
	LIMITED_EXTENDED_WELL_HEADERS,
	ListItem,
	MONTHLY_ITEMS,
	MONTHLY_PRODUCTION_COLORS,
	MONTHLY_RATIO_COLORS,
	PHASE_SHORT_LABELS,
	RELATIVE_TIME_X_AXIS_ITEM,
	TC_SHORT_Y_LABEL_CHARS,
	TIME_X_AXIS_ITEM,
	VALID_BASE_CUSTOM_FIELDS,
	VALID_COLUMNS,
	VALID_CUMS,
	VALID_DAILY_CUSTOM_FIELDS,
	VALID_MBT,
	VALID_MONTHLY_CUSTOM_FIELDS,
	VALID_NUMERIC,
	VALID_OTHER_FIELDS,
	VALID_PHASES,
	VALID_PLL_SERIES,
	VALID_PRESSURES,
	VALID_RATIOS,
	X_AXIS_COMPARISON_ITEMS,
	X_AXIS_ITEMS,
	X_AXIS_PROXIMITY_ITEMS,
	Y_ITEM_COLORS,
	Y_ITEM_SERIES_TYPES,
	Y_ITEM_SHAPES,
};
