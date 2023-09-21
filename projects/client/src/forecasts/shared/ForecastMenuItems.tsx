import _ from 'lodash';

import { fields as DETERMINISTIC_FORECAST_SUB_TYPES } from '@/inpt-shared/display-templates/deterministic-forecast-data/deterministic-forecast-sub-types.json';
import { fields as DETERMINISTIC_FORECAST_TYPES } from '@/inpt-shared/display-templates/deterministic-forecast-data/deterministic-forecast-types.json';
import { fields as FORECAST_STATUS } from '@/inpt-shared/display-templates/forecast-data/forecast-status.json';
import { fields as FORECAST_TYPES } from '@/inpt-shared/display-templates/forecast-data/forecast-types.json';

import { AxisItem, AxisValue } from '../charts/components/AxisControlSelection';
import { VALID_PHASES } from '../charts/components/graphProperties';
import {
	forecastMinMaxArrToMenuItems,
	makeAxisControlSelectionItem,
	makeRadioListSubMenu,
	makeSelectListMenu,
} from './forecast-menu-helpers';

/** Extract items to be passed to menus from display templates */
export const getItemsFromDt = (dt) =>
	_.map(dt, (value, key) => ({
		label: value.label,
		shortLabel: value.shortLabel,
		value: key,
	}));

const numberOfChartsItems: AxisItem[] = [
	{ label: '1', value: 1 },
	{ label: '2', value: 2 },
	{ label: '4', value: 4 },
	{ label: '6', value: 6 },
	{ label: '8', value: 8 },
];

const cumMinItems: AxisItem[] = [
	{ label: '0.1', value: 0.1 },
	{ label: '10', value: 10 },
	{ label: '100', value: 100 },
	{ label: '10,000', value: 10_000 },
	{ label: '100,000', value: 100_000 },
	{ label: '1,000,000', value: 1_000_000 },
	{ label: '10,000,000', value: 10_000_000 },
	{ label: 'All', value: 'all' },
];

const cumMaxItems: AxisItem[] = [
	{ label: '50,000', value: 50_000 },
	{ label: '100,000', value: 100_000 },
	{ label: '300,000', value: 300_000 },
	{ label: '500,000', value: 500_000 },
	{ label: '1,000,000', value: 1_000_000 },
	{ label: '10,000,000', value: 10_000_000 },
	{ label: '50,000,000', value: 50_000_000 },
	{ label: '100,000,000', value: 100_000_000 },
	{ label: 'All', value: 'all' },
];

const yearsBeforeItems: AxisItem[] = [
	{
		label: '0.25',
		value: 0.25,
	},
	{
		label: '0.5',
		value: 0.5,
	},
	{
		label: '1',
		value: 1,
	},
	{
		label: '2',
		value: 2,
	},
	{
		label: '5',
		value: 5,
	},
	{
		label: '10',
		value: 10,
	},
	{
		label: '25',
		value: 25,
	},
	{
		label: '50',
		value: 50,
	},
	{
		label: 'All',
		value: 'all',
	},
];

const yearsPastItems: AxisItem[] = [
	{
		label: '0.25',
		value: 0.25,
	},
	{
		label: '0.5',
		value: 0.5,
	},
	{
		label: '1',
		value: 1,
	},
	{
		label: '2',
		value: 2,
	},
	{
		label: '5',
		value: 5,
	},
	{
		label: '10',
		value: 10,
	},
	{
		label: '25',
		value: 25,
	},
	{
		label: '50',
		value: 50,
	},
	{
		label: 'All',
		value: 'all',
	},
];

const chartResolutionItems = [
	{
		label: 'Highest',
		shortLabel: 'Highest',
		value: 1,
	},
	{
		label: 'High',
		shortLabel: 'High',
		value: 5,
	},
	{
		label: 'Optimal',
		shortLabel: 'Opt',
		value: 10,
	},
	{
		label: 'Low',
		shortLabel: 'Low',
		value: 30,
	},
	{
		label: 'Lowest',
		shortLabel: 'Lowest',
		value: 60,
	},
];

const yBigMaxItems: AxisItem[] = forecastMinMaxArrToMenuItems([
	100_000,
	300_000,
	500_000,
	1_000_000,
	2_000_000,
	5_000_000,
	10_000_000,
	25_000_000,
	50_000_000,
	100_000_000,
	'all',
]);

const yMaxItems: AxisItem[] = forecastMinMaxArrToMenuItems([
	10,
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
	300_000,
	500_000,
	1_000_000,
	5_000_000,
	'all',
]);

const yBigMinItems: AxisItem[] = forecastMinMaxArrToMenuItems([
	0.001,
	0.01,
	0.1,
	1,
	2,
	5,
	10,
	50,
	100,
	1_000,
	5_000,
	10_000,
	'all',
]);

const yMinItems: AxisItem[] = forecastMinMaxArrToMenuItems([0.01, 0.1, 1, 2, 5, 10, 50, 100, 1_000, 'all']);

const xAxisItems = [
	{ value: 'time', label: 'Time' },
	{ value: 'relativeTime', label: 'Relative Time' },
	{ value: 'cumsum_oil', label: 'Cum Oil' },
	{ value: 'cumsum_gas', label: 'Cum Gas' },
	{ value: 'cumsum_water', label: 'Cum Water' },
	{ value: 'mbt', label: 'Material Balance Time' },
	{ value: 'mbt_filtered', label: 'Material Balance Time (Filtered)' },
];

const timeXAxisItems = [
	{ value: 'time', label: 'Time' },
	{ value: 'relativeTime', label: 'Relative Time' },
];

const fontSizeSelectItems = [50, 75, 100, 125, 150].map((value) => ({ value: value / 100, label: `${value}%` }));

const DEFAULT_FORECAST_MENU_VALUES: {
	chartResolution: AxisValue;
	cumMax: AxisValue;
	cumMin: AxisValue;
	yearsBefore: AxisValue;
	yearsPast: AxisValue;
	yMax: AxisValue;
	yMin: AxisValue;
} = {
	chartResolution: 10,
	cumMax: 10_000,
	cumMin: 0.1,
	yearsBefore: 'all',
	yearsPast: 5,
	yMax: 'all',
	yMin: 0.1,
};

const ChartResolutionSubMenu = makeRadioListSubMenu({ label: 'Chart Resolution', items: chartResolutionItems });

const CumMinSubMenu = makeRadioListSubMenu({ label: 'X Min', items: cumMinItems });

const CumMaxSubMenu = makeRadioListSubMenu({ label: 'X Max', items: cumMaxItems });

const YearsBeforeSubMenu = makeRadioListSubMenu({ label: 'Years Before Production End', items: yearsBeforeItems });

const YearsPastSubMenu = makeRadioListSubMenu({ label: 'Years Past Production End', items: yearsPastItems });

const YMaxSubMenu = makeRadioListSubMenu({ label: 'Y Max', items: yMaxItems });

const YMinSubMenu = makeRadioListSubMenu({ label: 'Y Min', items: yMinItems });

const XAxisSubMenu = makeRadioListSubMenu({ label: 'X-Axis', items: xAxisItems });

const TimeXAxisSubMenu = makeRadioListSubMenu({ label: 'X-Axis', items: timeXAxisItems });

const FontSizeScaleSubMenu = makeRadioListSubMenu({ label: 'Font Size Scale', items: fontSizeSelectItems });

// AxisControlSelectionItems
const CumMinAxisControlSelection = makeAxisControlSelectionItem({ label: 'X Min', items: cumMinItems });

const CumMaxAxisControlSelection = makeAxisControlSelectionItem({ label: 'X Max', items: cumMaxItems });

const YearsBeforeAxisControlSelection = makeAxisControlSelectionItem({
	label: 'Years Before Production End',
	items: yearsBeforeItems,
});

const YearsPastAxisControlSelection = makeAxisControlSelectionItem({
	label: 'Years Past Production End',
	items: yearsPastItems,
});

const YMaxAxisControlSelection = makeAxisControlSelectionItem({ label: 'Y Max', items: yMaxItems });

const YMinAxisControlSelection = makeAxisControlSelectionItem({ label: 'Y Min', items: yMinItems });

const forecastStatusItems = getItemsFromDt(FORECAST_STATUS);

const StatusFilterMenuButton = makeSelectListMenu({
	items: forecastStatusItems,
	label: 'Status',
	tooltipTitle: 'Filter By Approval',
	color: 'purple',
});

const PhaseMenuButton = makeSelectListMenu({
	items: VALID_PHASES.map((value) => ({ label: _.capitalize(value), value })),
	label: 'Phase',
	tooltipTitle: 'Select Phase',
	color: 'purple',
});

const TypeFilterMenuButton = makeSelectListMenu({
	items: getItemsFromDt(FORECAST_TYPES),
	label: 'Type',
	tooltipTitle: 'Filter By Type',
	color: 'purple',
});

const DeterministicTypeFilterMenuButton = makeSelectListMenu({
	items: getItemsFromDt(DETERMINISTIC_FORECAST_TYPES),
	label: 'Type',
	tooltipTitle: 'Filter By Type',
	color: 'purple',
});

const DeterministicSubTypeFilterMenuButton = makeSelectListMenu({
	items: getItemsFromDt(DETERMINISTIC_FORECAST_SUB_TYPES),
	label: 'Sub Type',
	tooltipTitle: 'Filter By Sub Type',
	color: 'purple',
});

export {
	chartResolutionItems,
	ChartResolutionSubMenu,
	CumMaxAxisControlSelection,
	cumMaxItems,
	CumMaxSubMenu,
	CumMinAxisControlSelection,
	cumMinItems,
	CumMinSubMenu,
	DEFAULT_FORECAST_MENU_VALUES,
	DeterministicSubTypeFilterMenuButton,
	DeterministicTypeFilterMenuButton,
	FontSizeScaleSubMenu,
	fontSizeSelectItems,
	forecastStatusItems,
	numberOfChartsItems,
	PhaseMenuButton,
	StatusFilterMenuButton,
	timeXAxisItems,
	TimeXAxisSubMenu,
	TypeFilterMenuButton,
	xAxisItems,
	XAxisSubMenu,
	yBigMaxItems,
	yBigMinItems,
	YearsBeforeAxisControlSelection,
	yearsBeforeItems,
	YearsBeforeSubMenu,
	YearsPastAxisControlSelection,
	yearsPastItems,
	YearsPastSubMenu,
	YMaxAxisControlSelection,
	yMaxItems,
	YMaxSubMenu,
	YMinAxisControlSelection,
	yMinItems,
	YMinSubMenu,
};
