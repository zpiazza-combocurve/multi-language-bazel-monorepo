import {
	convertDateToIdx,
	convertDateToMilli,
	convertIdxToDate,
	convertIdxToMilli,
	convertMilliToIdx,
} from '@combocurve/forecast/helpers';
import _ from 'lodash';
import type { graphset, gui, scaleX, series } from 'zingchart';

import { isDevelopmentRoute } from './env';
import { rgbaToRGB } from './text';
import { deepMerge, isObject } from './utilities';
import { ZingchartZoomoutPluginOptions } from './zingchart/cc-zoomout-plugin';
import { zingchart } from './zingchart/entry';

// skips the intro loading screen (most likely invisible to human eye anyway)
zingchart.DEV.SKIPPROGRESS = true;
// indicates to the lib that there are no external resources to load (images)
zingchart.DEV.RESOURCES = false;
// skips calculations of several plot relates statistics (min, max, sum, avg values)
zingchart.DEV.PLOTSTATS = false;

/* +types */
declare global {
	const XLSX: typeof import('xlsx');
}

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		export2excel: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		ZC: any;
	}
}

export type ZingchartData = graphset & { gui?: gui } & {
	// our custom zoom plugin, needs to be truthy for it to be enabled
	'cc-zoomout-plugin'?: boolean | ZingchartZoomoutPluginOptions;
};

// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
export type ZingchartEvents = Record<string, Function | undefined>;

export type ZingchartSerie = series;
export type ColorBySeriesObject = { [key: string]: series & { wells: string[]; colorByValue: string } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type ZingchartTheme = { palette?: any; graph?: ZingchartData };

export type ZingChartScaleX = scaleX;

export type ZingchartRender = {
	id: string;
	data: ZingchartData;
	events?: ZingchartEvents;
	defaults?: ZingchartTheme;
	modules?: string;
	width?: string;
	height?: string;
	output?: string;
};

export type ZingchartModule = 'fastline' | 'cc-zoomout-plugin' | 'selection-tool';
/* -types */

const { ZC } = window;

ZC.LICENSE = ['6569340c961c0c5773b1906ddc367bf7'];

export { convertIdxToMilli, convertMilliToIdx, convertIdxToDate, convertDateToIdx, convertDateToMilli };
export { zingchart };

/* +Global functions for zingchart menus */
zingchart.inpt = zingchart.inpt || {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
zingchart.inpt.clearSelection = (event: any) => {
	zingchart.exec(event.id, 'clearselection');
};

zingchart.inpt.fastLineClearSelection = ({ id }) => zingchart.plugins.fastline.clearSelection({ id });
/* -Global functions for zingchart menus */

/* eslint-disable */
// Code from zingchart
window.export2excel = function (p) {
	zingchart.exec(p.id, 'downloadRAW', {
		callback: function (rawdata) {
			if (rawdata[0][0] === 'Category') {
				rawdata[0][0] = 'X-axis';
			}
			if (rawdata[0][0] !== 'Date') {
				rawdata.slice(1).forEach((x) => (x[0] = parseFloat(x)));
			}
			const toRemoveIndex = rawdata[0].reduce((acc, v, i) => {
				if (v.includes('Series')) {
					acc.push(i);
				}
				return acc;
			}, []);
			rawdata.forEach((x, i) => {
				rawdata[i] = x.filter((_, j) => !toRemoveIndex.includes(j));
			});

			const filename = (p.filename || p.id) + '.xlsx';
			const ws_name = 'Sheet';
			const wb = XLSX.utils.book_new();
			const ws = XLSX.utils.aoa_to_sheet(rawdata);
			XLSX.utils.book_append_sheet(wb, ws, ws_name);
			XLSX.writeFile(wb, filename);
		},
	});
};
/* eslint-enable */

/**
 * Helper for dealing with modules property of zingchart, kind of like classnames pakcages
 *
 * @example
 * 	joinModules('foo,bar', ['baz', 'foobar']); // 'foo,bar,baz,foobar'
 */
export const zingJoinModules = (...params: (undefined | string | ZingchartModule[])[]) =>
	params
		.filter(Boolean)
		.flatMap((p) => (Array.isArray(p) ? p.join(',') : p))
		.join(',');

/* CONSTANTS */
export const DEFAULT_MAX_NODES = 35000; // roughly a little more than necessary for the production on forecast charts

export const PROXIMITY_TARGET_WELL_COLOR = '#FF00FF';
export const PRIMARY_COLOR = '#00bfa5';
export const BLUE_1 = 'rgba(99,134,255,1)';
export const BLUE_2 = 'rgba(54,162,235,1)';
export const BROWN_1 = 'rgba(62,39,35,1)';
export const GOLD_1 = 'rgba(255,182,0,1)';
export const GRAY_1 = 'rgba(96,125,139,1)';
export const GRAY_2 = 'rgba(179,182,183,1)';
export const GREEN_1 = 'rgba(153,255,0,1)';
export const GREEN_2 = 'rgba(88,214,141,1)';
export const MAROON_1 = 'rgba(83,0,31,1)';
export const ORANGE_1 = 'rgba(255,159,64,1)';
export const PINK_1 = 'rgba(255,99,132,1)';
export const PINK_2 = 'rgba(245,183,177,1)';
export const PURPLE_1 = 'rgba(153,102,255,1)';
export const PURPLE_2 = 'rgba(144,125,178,1)';
export const RED_1 = 'rgba(198,40,40,1)';
export const RED_2 = 'rgba(132,0,50,1)';
export const TEAL_1 = 'rgba(75,192,192,1)';
export const YELLOW_1 = 'rgba(255,206,86,1)';

/* Colors */
export const OIL_COLOR = 'rgba(18,196,152,1)';
export const GAS_COLOR = 'rgba(249,83,75,1)';
export const WATER_COLOR = 'rgba(34,138,218,1)';
export const CUMSUM_OIL_COLOR = 'rgba(50,100,50,1)';
export const CUMSUM_GAS_COLOR = 'rgba(150,50,30,1)';
export const CUMSUM_WATER_COLOR = 'rgba(0,50,200,1)';
export const OIL_GAS_RATIO_COLOR = 'rgba(60,120,60,1)';
export const OIL_WATER_RATIO_COLOR = 'rgba(80,200,100,1)';
export const GAS_OIL_RATIO_COLOR = 'rgba(200,30,20,1)';
export const GAS_WATER_RATIO_COLOR = 'rgba(255,120,90,1)';
export const WATER_OIL_RATIO_COLOR = 'rgba(0,125,230,1)';
export const WATER_GAS_RATIO_COLOR = 'rgba(150,200,255,1)';
export const PHASE_HOVER_COLOR = 'rgba(215,183,80,1)';
export const WELL_PROD_AVERAGE_COLOR = GREEN_1;
export const WELL_COUNT_COLOR = YELLOW_1;

export const genOpac = (rgbaColor: string) => (opac: number) => {
	// ONLY WORKS FOR RGBA WITH OPACITY 1
	const noSpaces = rgbaColor.replace(/\s/g, '');
	const rgbArr = noSpaces.substring(5, noSpaces.length - 3).split(',');
	return `rgba(${rgbArr.join(',')},${opac.toString()})`;
};

export const scaleColor = (rgbaColor: string) => (scaling: number) => {
	// the higher the scaling, the lighter the shade
	// values capped at 255
	const noSpaces = rgbaColor.replace(/\s/g, '');
	const rgbArr = noSpaces
		.substring(5, noSpaces.length - 3)
		.split(',')
		.map((val) => Math.ceil(Math.min(Number(val) * scaling, 255)));
	return `rgba(${rgbArr.join(',')},1)`;
};

// TODO make constants UPPERCASED
// standardized ordering of the cc colors
export const colorsArray = [
	PURPLE_1,
	ORANGE_1,
	PINK_1,
	BLUE_1,
	RED_1,
	GREEN_1,
	GRAY_1,
	TEAL_1,
	YELLOW_1,
	GRAY_2,
	BLUE_2,
	GREEN_2,
	BROWN_1,
	PINK_2,
	RED_2,
	GOLD_1,
	PURPLE_2,
	MAROON_1,
];

export const scatterCollorsArray = [
	PINK_1,
	BLUE_1,
	RED_1,
	GREEN_1,
	GRAY_1,
	TEAL_1,
	YELLOW_1,
	GRAY_2,
	GREEN_2,
	BROWN_1,
	PINK_2,
	RED_2,
	GOLD_1,
	PURPLE_2,
	MAROON_1,
];
export const forecastSeriesColors = {
	P10: PURPLE_1,
	P50: ORANGE_1,
	P90: PINK_1,
	best: BLUE_1,
};

export const phaseColors = {
	oil: OIL_COLOR,
	gas: GAS_COLOR,
	water: WATER_COLOR,
	'oil/gas': OIL_COLOR,
	'oil/water': OIL_COLOR,
	'gas/oil': GAS_COLOR,
	'gas/water': GAS_COLOR,
	'water/oil': WATER_COLOR,
	'water/gas': WATER_COLOR,
	drip_condensate: PURPLE_1,
	boe: GRAY_2,
	mcfe: GRAY_1,
	ngl: ORANGE_1,
};

export const pressureColors = {
	bottom_hole_pressure: PURPLE_1,
	casing_head_pressure: GREEN_1,
	flowline_pressure: GRAY_1,
	gas_lift_injection_pressure: ORANGE_1,
	tubing_head_pressure: YELLOW_1,
	vessel_separator_pressure: PINK_1,
};

export const otherFieldsColors = {
	gasInjection: PURPLE_1,
	waterInjection: ORANGE_1,
	co2Injection: PINK_1,
	steamInjection: BLUE_1,
	ngl: RED_1,
};

export const customFieldColors = {
	customNumber0Monthly: GREEN_1,
	customNumber1Monthly: GRAY_1,
	customNumber2Monthly: TEAL_1,
	customNumber3Monthly: YELLOW_1,
	customNumber4Monthly: GRAY_2,
	customNumber0Daily: scaleColor(GREEN_1)(0.5),
	customNumber1Daily: scaleColor(GRAY_1)(0.5),
	customNumber2Daily: scaleColor(TEAL_1)(0.5),
	customNumber3Daily: scaleColor(YELLOW_1)(0.5),
	customNumber4Daily: scaleColor(GRAY_2)(0.5),
};

export const OIL_LOW_COLOR = genOpac(OIL_COLOR)(0.3);
export const GAS_LOW_COLOR = genOpac(GAS_COLOR)(0.3);
export const WATER_LOW_COLOR = genOpac(WATER_COLOR)(0.3);

export const phaseColorsOpac = {
	oil: OIL_LOW_COLOR,
	gas: GAS_LOW_COLOR,
	water: WATER_LOW_COLOR,
};

export const forecastEditingColor = ORANGE_1;

export const phaseColorsEditing = {
	oil: 'rgba(82, 224, 98, 1)',
	gas: 'rgba(239, 150, 143, 1)',
	water: 'rgba(143, 209, 239, 1)',
};

export const opacityColorsArray = colorsArray.map((color) => {
	return {
		full: color,
		opac: genOpac(color)(0.1),
	};
});

export const fastlineSelectedColor = opacityColorsArray[0].full;

/* End: Colors */
export const forecastSeries = [
	{
		label: 'Best',
		value: 'best',
		color: forecastSeriesColors.best,
		customOpac: genOpac(forecastSeriesColors.best),
	},
	{ label: 'P50', value: 'P50', color: forecastSeriesColors.P50, customOpac: genOpac(forecastSeriesColors.P50) },
	{ label: 'P10', value: 'P10', color: forecastSeriesColors.P10, customOpac: genOpac(forecastSeriesColors.P10) },
	{ label: 'P90', value: 'P90', color: forecastSeriesColors.P90, customOpac: genOpac(forecastSeriesColors.P90) },
];

export const phases: Array<{
	value: 'oil' | 'gas' | 'water';
	label: string;
	short: string;
	color: string;
	opac: string;
}> = [
	{ value: 'oil', label: 'Oil', short: 'O', color: phaseColors.oil, opac: phaseColorsOpac.oil },
	{ value: 'gas', label: 'Gas', short: 'G', color: phaseColors.gas, opac: phaseColorsOpac.gas },
	{ value: 'water', label: 'Water', short: 'W', color: phaseColors.water, opac: phaseColorsOpac.water },
];

/* Default Event Helpers */
const createLabelClickHandler =
	(id: string, events: ZingchartEvents = {}) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	(event: any) => {
		if (events.label_click) {
			// allow custom handlers
			if (events.label_click(event) === false) {
				// explicit false return prevents default behavior
				return false;
			}
		}
		if (event.labelid === 'zoom-out') {
			zingchart.exec(id, 'viewall');
		}
		return undefined;
	};

const createZoomHandler =
	(id: string, events: ZingchartEvents = {}) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	(event: any) => {
		if (events.zoom) {
			// allow custom handlers
			if (events.zoom(event) === false) {
				// explicit false return prevents default behavior
				return false;
			}
		}
		if (event.action === 'viewall') {
			zingchart.exec(id, 'updateobject', {
				type: 'label',
				data: {
					id: 'zoom-out',
					visible: false,
				},
			});
		} else {
			zingchart.exec(id, 'updateobject', {
				type: 'label',
				data: {
					id: 'zoom-out',
					visible: true,
				},
			});
		}
		return undefined;
	};

interface ExtrasRenderConfig {
	legendMinimized?: boolean;
}

const createLoadHandler =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	(id: string, extras: ExtrasRenderConfig | undefined, events: ZingchartEvents | undefined) => (event: any) => {
		if (extras?.legendMinimized) {
			zingchart.exec(id, 'legendminimize');
		}
		if (events?.load) {
			return events.load(event);
		}
		return undefined;
	};
/* End: Default Event Helpers */

/**
 * Merges zingchart config objects in a safe way, will return a clone of the results because zingcharts tends to mutate
 * the values which is bad for global config objects
 */
export const mergeZingchartConfigs = (...params: ZingchartData[]): ZingchartData =>
	// TODO findout how to improve performance, raise concern to zingchart team, investigate which properties are being mutated
	params.reduce(
		(acc, value = {}) => _.cloneDeepWith(deepMerge(acc, value), (v, key) => (key === 'series' ? v : undefined)),
		{} as ZingchartData
	);

/**
 * @param extras Has some extra common config
 * @returns Zingchart.render configuration value with some defaults to handle zoom and other values
 */
function getZingConfig({ events, id, modules = '', ...config }: ZingchartRender, extras?: ExtrasRenderConfig) {
	return {
		id,
		width: '100%',
		height: '100%',
		output: 'canvas',
		modules: zingJoinModules(modules, 'cc-zoomout-plugin'), // always includes the zoomout label plugin
		...config,
		events: {
			...events,
			label_click: createLabelClickHandler(id, events),
			zoom: createZoomHandler(id, events),
			load: createLoadHandler(id, extras, events),
		},
	};
}

/**
 * Will add support for `extras` property in the config object
 *
 * @example
 * 	const barConfig = withExtras(({ colorFull }) => ({
 * 		type: 'bar',
 * 		plot: { borderColor: colorFull || opacityColorsArray[0].full },
 * 	}));
 *
 * 	<Zingchart
 * 		data={barConfig({
 * 			series: [{ values: [1, 2, 34] }],
 * 			extras: { colorFull: 'green' },
 * 		})}
 * 	/>;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function withExtras<P = any>(fn: (config: P) => ZingchartData) {
	return (config: ZingchartData & { extras: P }) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		return mergeZingchartConfigs(fn((config?.extras ?? {}) as any as P), config);
	};
}

/** Wrapper for creating render chart function */
export function withRender<P>(configFn: (config: P) => ZingchartData) {
	return (
		id: string,
		config: P & { extras?: ExtrasRenderConfig; modules?: ZingchartRender['modules'] },
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		events: any = {}
	) => {
		// create a scatter chart
		if (id && isObject(config)) {
			const data = configFn(config);
			const renderConfig = getZingConfig({ id, events, modules: config.modules, data }, config.extras);
			zingchart.render(renderConfig);
			return renderConfig;
		}
		return undefined;
	};
}

export const SCALE_LABEL_FONT_COLOR = '#8c8c8c';

export const DEFAULT_ITEM_FONT_SIZE = 12;

// only one that seems to look consistent horizontally and vertically
export const DEFAULT_ITEM_FONT_FAMILY = 'sans-serif';

export const scaleItemFontSize = (scale: number) => `${Math.floor(DEFAULT_ITEM_FONT_SIZE * scale)}px`;

export const DEFAULT_Y_OFFSET_END = 24;

export const genScaleX = ({
	fontSizeScale = 1,
	maxValue = undefined,
	minValue = undefined,
	time,
	xGuide,
	xLabel,
	xLogScale = false,
}: {
	maxValue?: number;
	minValue?: number;
	/** If it is a time serie */
	time?: boolean;
	xLogScale?: boolean;
	fontSizeScale?: number;
	/** If should show guide */
	xGuide?: boolean;
	/** Scale text Text to display */
	xLabel?: string;
}): ZingchartData['scaleX'] => ({
	guide: {
		alpha: 0.3,
		lineColor: '#8c8c8c',
		visible: xGuide,
		// visible: false,
	},
	item: {
		fontColor: '#a5a5a5',
		fontSize: scaleItemFontSize(fontSizeScale),
		maxChars: 10,
	},
	label: xLabel
		? {
				fontColor: SCALE_LABEL_FONT_COLOR,
				fontFamily: DEFAULT_ITEM_FONT_FAMILY,
				fontSize: 14,
				fontStyle: 'normal',
				fontWeight: 'normal',
				text: xLabel,
		  }
		: undefined,
	logBase: xLogScale ? 10 : undefined,
	maxItems: 10,
	maxValue,
	minValue,
	progression: xLogScale ? 'log' : 'linear',
	step: time ? '3month' : undefined,
	// stepMultiplier: time ? 6 : undefined,
	thousandsSeparator: ',',
	transform: time
		? {
				type: 'date',
				all: '%m/%d/%Y',
		  }
		: undefined,
	zooming: true,
});

export const genScaleY = ({
	maxValue,
	minValue,
	log,
	yGuide,
	yLabel,
	fontSizeScale = 1,
	time = false,
}: {
	maxValue?: number;
	minValue?: number;
	/** If it is a time serie */
	time?: boolean;
	log?: boolean;
	fontSizeScale?: number;
	/** If should show guide */
	yGuide?: boolean;
	/** Scale text Text to display */
	yLabel?: string;
}): ZingchartData['scaleY'] & { 'extend-max-value'?: boolean; 'extend-min-value'?: boolean } => ({
	guide: {
		alpha: 0.3,
		lineColor: '#8c8c8c',
		visible: yGuide,
	},
	item: {
		fontColor: '#a5a5a5',
		fontSize: scaleItemFontSize(fontSizeScale),
	},
	label: yLabel
		? {
				fontColor: SCALE_LABEL_FONT_COLOR,
				fontFamily: DEFAULT_ITEM_FONT_FAMILY,
				fontSize: 14,
				fontStyle: 'normal',
				fontWeight: 'normal',
				text: yLabel,
		  }
		: undefined,
	maxValue,
	logBase: 10,
	minorTicks: 10,
	minValue,
	step: time ? '3month' : undefined,
	progression: log ? 'log' : 'linear',
	thousandsSeparator: ',',
	transform: time
		? {
				type: 'date',
				all: '%m/%d/%Y',
		  }
		: undefined,
	zooming: true,
	offsetEnd: DEFAULT_Y_OFFSET_END,
	'extend-min-value': false,
	'extend-max-value': false,
});

// set up as function for now in case we ever want to customize it
export const genLegendConfig = () => ({
	alpha: 0,
	borderColor: 'transparent',
	borderWidth: 1,
	draggable: true,
	dragHandler: 'icon',
	header: {
		backgroundColor: 'transparent',
		bold: false,
		borderBottom: '1px solid #8c8c8c',
		fontColor: '#a5a5a5',
		text: 'Legend',
	},
	highlightPlot: true,
	icon: {
		lineColor: '#a5a5a5',
	},
	item: {
		fontColor: '#a5a5a5',
		fontSize: '10px',
	},
	layout: 'x1',
	marker: {
		borderColor: 'transparent',
		borderRadius: '3px',
		type: 'inherit',
	},
	maxItems: 12,
	minimize: true,
	overflow: 'scroll',
	visible: true,
});

interface GeneralConfig {
	adjustLayout?: NonNullable<ZingchartData['plotarea']>['adjustLayout'];
	crosshairX?: boolean;
	crosshairY?: boolean;
	decimals?: number;
	legend?: boolean;
	log?: boolean;
	minY?: number;
	preview?: boolean;
	showGUIbtn?: boolean;
	time?: boolean;
	title?: string;
	toggleScale?: boolean;
	tooltip?: boolean;
	xGuide?: boolean;
	xLabel?: string;
	xLogScale?: boolean;
	yGuide?: boolean;
	yLabel?: string;
	allowDownloadXLS?: boolean;
	allowDownloadPDF?: boolean;
	zoomOutColor?: string;
	zoomOutConfig?: ZingchartZoomoutPluginOptions;
}

/** @note AFFECTS ALL GRAPHS, MAKE SURE THAT IT SUPPORTS DATES AND NON-DATES AS WELL AS OTHER POSSIBLE CONFIGS */
export const generalConfig = ({
	adjustLayout = true,
	crosshairX,
	crosshairY,
	decimals = 2,
	legend = true,
	log = false,
	minY = undefined,
	preview,
	showGUIbtn = false,
	time = true,
	title,
	toggleScale = false,
	tooltip = false,
	xGuide = true,
	xLabel,
	xLogScale = false,
	yGuide = true,
	yLabel,
	allowDownloadXLS = true,
	allowDownloadPDF = true,
	zoomOutColor = '#9966ff',
	zoomOutConfig,
}: GeneralConfig = {}): ZingchartData => ({
	utc: time ? true : undefined,
	backgroundColor: 'transparent',
	gui: {
		contextMenu: {
			position: 'left',
			button: { visible: showGUIbtn },
			gear: { backgroundColor: '#a5a5a5' },
		},
		behaviors: [
			{ id: 'DownloadCSV', enabled: 'none' },
			{ id: 'DownloadSVG', enabled: 'none' },
			{
				id: 'DownloadXLS',
				text: 'Download XLS',
				enabled: allowDownloadXLS ? 'all' : 'none',
				'custom-function': 'export2excel()',
			},
			{
				id: 'DownloadPDF',
				text: 'Download PDF',
				enabled: allowDownloadPDF ? 'all' : 'none',
			},
			{ id: 'LinScale', enabled: toggleScale ? 'all' : 'none' },
			{ id: 'LogScale', enabled: toggleScale ? 'all' : 'none' },
			{ id: 'Print', enabled: 'none' },
			{ id: 'Reload', enabled: 'none' }, // disabled for this release
			{ id: 'ViewDataTable', enabled: 'none' },
			{ id: 'ViewSource', enabled: isDevelopmentRoute() ? 'all' : 'none' },
			{ id: 'ZoomIn', enabled: 'none' },
			{ id: 'ZoomOut', enabled: 'none' },
		],
	},
	plotarea: {
		adjustLayout,
		marginLeft: 'dynamic',
		marginTop: 5,
	},
	scaleY: genScaleY({ minValue: minY, log, yGuide, yLabel }),
	scaleX: genScaleX({ time, xGuide, xLabel, xLogScale }),
	tooltip: {
		visible: tooltip, // tooltip disabled for performance reasons, default palette available if wants to enable tooltip for single charts
		borderColor: 'transparent',
		borderRadius: 5,
		borderWidth: 0,
		decimals,
		fontSize: 15,
		shadow: false,
		thousandsSeparator: ',',
	},
	zoomSnap: true,
	zoom: {
		backgroundColor: '#00BFA5',
		borderColor: 'transparent',
		borderWidth: 1,
		shared: true,
	},
	preview: preview
		? {
				backgroundColor: 'transparent',
		  }
		: undefined,
	legend: !legend ? undefined : genLegendConfig(),
	crosshairX: !crosshairX
		? undefined
		: {
				exact: true,
				lineColor: '#8c8c8c',
				plotLabel: {
					visible: false,
				},
				scaleLabel: {
					alpha: 0.6,
					backgroundColor: '#8c8c8c',
					borderColor: 'transparent',
					borderRadius: '5px',
					fontColor: '#ffffff',
					fontWeight: 'bold',
					textAlpha: 1,
				},
		  },
	crosshairY: !crosshairY
		? undefined
		: {
				exact: true,
				lineColor: '#8c8c8c',
				plotLabel: {
					visible: false,
				},
				scaleLabel: {
					alpha: 0.6,
					backgroundColor: '#8c8c8c',
					borderColor: 'transparent',
					borderRadius: '5px',
					fontColor: '#ffffff',
					fontWeight: 'bold',
					textAlpha: 1,
				},
		  },
	title: title
		? {
				'margin-bottom': 10,
				'margin-left': 0,
				'margin-right': 0,
				'margin-top': 10,
				fontSize: 16,
				fontWeight: 'normal',
				position: '0% 0%',
				text: title,
		  }
		: undefined,
	selectionTool: {
		mask: {
			alpha: 0.3,
			backgroundColor: rgbaToRGB(opacityColorsArray[0].full),
			borderColor: rgbaToRGB(opacityColorsArray[0].full),
			borderWidth: 2,
		},
	},
	'cc-zoomout-plugin': { size: DEFAULT_Y_OFFSET_END, color: zoomOutColor, ...zoomOutConfig },
});

/** Will pass `extras` properties to the `generalConfig` function and doo a deep merge */
const withGeneralConfig =
	<
		// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
		P = {}
	>(
		fn: (extras: P) => ZingchartData
	) =>
	(extras: P & GeneralConfig): ZingchartData =>
		mergeZingchartConfigs(generalConfig(extras), fn(extras));

export const lineConfig = withGeneralConfig(() => ({
	type: 'line',
	plot: {
		highlight: true,
		lineWidth: '2px',
		marker: { visible: false },
		markersOnTop: false,
		selectionMode: 'multiple',
	},
	scaleY: { minValue: 0.1 },
}));

export const scatterConfig = withGeneralConfig(
	({
		selectedState = false,
		colorFull,
		plotarea,
	}: {
		selectedState?: boolean;
		colorFull?: string;
		plotarea?: ZingchartData['plotarea'];
	}) => ({
		type: 'scatter',
		plot: {
			highlight: true,
			mode: 'fast',
			selectionMode: 'multiple',
			marker: {
				size: 3,
				alpha: 0.8,
				type: 'circle',
				borderColor: 'transparent',
			},
			markersOnTop: false,
			selectedMarker: selectedState ? { backgroundColor: colorFull || opacityColorsArray[0].full } : undefined,
		},
		scaleY: {
			minValue: 0.1,
		},
		plotarea,
	})
);

export const getScatterConfig = withExtras(scatterConfig);

export const getBarConfig = withExtras(
	withGeneralConfig(
		({
			colorFull,
			colorOpac,
			valueBox = false,
			animation = true,
			selectedState = false,
		}: {
			colorFull?: string;
			colorOpac?: string;
			valueBox?: boolean;
			animation?: boolean;
			selectedState?: boolean;
		}) => ({
			type: 'bar',
			plot: {
				backgroundColor: colorOpac || opacityColorsArray[0].opac,
				barSpaceLeft: 0.15,
				barSpaceRight: 0.15,
				borderColor: colorFull || opacityColorsArray[0].full,
				borderRadiusTopLeft: 10,
				borderRadiusTopRight: 10,
				borderWidth: 1,
				highlight: true,
				selectionMode: 'multiple',
				animation: animation
					? {
							effect: 1,
							speed: 100,
							sequence: 2,
					  }
					: undefined,
				selectedState: selectedState
					? {
							backgroundColor: colorFull || opacityColorsArray[0].full,
					  }
					: undefined,
				valueBox: valueBox
					? {
							fontSize: 11,
							thousandsSeparator: ',',
					  }
					: undefined,
			},
			scaleX: {
				placement: 'default',
				tick: {
					placement: 'cross',
				},
				itemsOverlap: false,
				guide: { visible: true },
			},
		})
	)
);

export const markerScatterSeriesConfig = ({ plotId, markerColor, markerShape, markerSize = 5 }) => ({
	id: plotId,
	type: 'scatter',
	marker: {
		backgroundColor: markerColor,
		type: markerShape,
		size: markerSize,
	},
	legendItem: {
		visible: false,
	},
	legendMarker: {
		visible: false,
	},
});

export const scatterSeriesConfig = ({
	alpha = 0.8,
	color = colorsArray[0],
	markerType = 'circle',
	maxNodes = DEFAULT_MAX_NODES,
	maxTrackers = 100000,
	size = 3,
	// tooltip = true,
	forcedTooltip: tooltip = false, // new property so it doesn't conflict with temporally disabled tooltips
}) => {
	const config: ZingchartSerie = {
		alpha,
		type: 'scatter',
		marker: {
			alpha,
			backgroundColor: color,
			borderColor: 'transparent',
			size,
			type: markerType,
		},
		maxNodes,
		legendMarker: {
			backgroundColor: color,
			borderColor: 'transparent',
			type: markerType,
		},
		segmentTrackers: false,
		tooltip: { decimals: 2, visible: tooltip },
	};

	if (tooltip) {
		config.maxTrackers = maxTrackers;
	}

	return config;
};

export const lineSeriesConfig = ({
	alpha = 0.8,
	borderRadius = '3px',
	color = colorsArray[0],
	legendMarker = {},
	lineStyle = 'solid',
	lineWidth = '2px',
	markerSize = '3px',
	markerType = 'circle',
	markerZIndex = 0,
	maxNodes = DEFAULT_MAX_NODES,
	maxTrackers = 100000,
	showMarkers = false,
	// tooltip = true,
	forcedTooltip: tooltip = false,
}) => {
	const config: ZingchartSerie = {
		alpha,
		lineColor: color,
		lineStyle,
		lineWidth,
		marker: {
			backgroundColor: color,
			visible: showMarkers,
			size: markerSize,
			type: markerType,
			zIndex: markerZIndex,
		},
		maxNodes,
		legendMarker: {
			backgroundColor: color,
			borderColor: 'transparent',
			borderRadius,
			lineStyle,
			type: 'line',
			...legendMarker,
		},
		type: 'line',
		segmentTrackers: !showMarkers,
		tooltip: { decimals: 2, visible: tooltip },
	};

	if (tooltip) {
		config.maxTrackers = maxTrackers;
	}

	return config;
};

export const zingLine = withRender(withExtras(lineConfig));

export const zingMixed = withRender((config: ZingchartData & { extras?: ZingchartData }) => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	...mergeZingchartConfigs(config.extras as any, config),
	type: 'mixed',
}));

export function zingModify(id: string, config: ZingchartData) {
	// modifies the current graph's config
	if (id && isObject(config)) {
		zingchart.exec(id, 'modify', { data: config });
	}
}

export function zingDestroy(id: string) {
	// destroys the chart
	if (id) {
		zingchart.exec(id, 'destroy');
	}
}

export function zingClearSelection(id: string) {
	// clears the selection state on the current graph
	if (id) {
		zingchart.exec(id, 'clearselection');
	}
}

export function zingDisableContextMenu(id: string) {
	if (id) {
		zingchart.bind(id, 'contextmenu', () => false);
	}
}

// https://www.zingchart.com/docs/api/methods#getobjectinfo
// https://insidepetroleum.slack.com/archives/CL65ASJ3S/p1639493462061500?thread_ts=1638313008.031900&cid=CL65ASJ3S
export function isZingchartZoomed(id: string) {
	const {
		minValue: minY,
		minValue_: minY_,
		maxValue: maxY,
		maxValue_: maxY_,
	} = zingchart.exec(id, 'getobjectinfo', { object: 'scale', name: 'scale-y' });
	const {
		minValue: minX,
		minValue_: minX_,
		maxValue: maxX,
		maxValue_: maxX_,
	} = zingchart.exec(id, 'getobjectinfo', { object: 'scale', name: 'scale-x' });

	return minY !== minY_ || maxY !== maxY_ || minX !== minX_ || maxX !== maxX_;
}

/**
 * Minimal combocurve zinchart config for properties that cannot be included in the `CC_THEME` for any reason
 *
 * Also:
 *
 * - Will enable the zoomout label by defaults, you still need to include it in the modules property
 *
 * @note check why some of these properties cannot be included in `ZC_CC_THEME`
 * @note be careful when adding more props here since this will be reused in most charts, some properties can cause performance issues
 */
export const ZC_SHARED_CONFIG = {
	selectionTool: {
		mask: {
			alpha: 0.3,
			backgroundColor: rgbaToRGB(opacityColorsArray[0].full),
			borderColor: rgbaToRGB(opacityColorsArray[0].full),
			borderWidth: 2,
		},
	},
	plot: {
		marker: { size: 3, borderColor: 'transparent', type: 'circle', alpha: 0.8 },
		tooltip: {
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderRadius: 5,
			borderWidth: 0,
			'font-size': 15,
			thousandsSeparator: ',',
			color: ORANGE_1,
			shadow: false,
			padding: 10,
		},
	},
	'cc-zoomout-plugin': { size: DEFAULT_Y_OFFSET_END },
} as ZingchartData;

/** Zingchart combocurve theme, pass it to the `defaults` property: <Zingchart defaults={ZC_CC_THEME} /> */
export const ZC_CC_THEME: ZingchartTheme = {
	graph: {
		legend: {
			alpha: 0,
			borderColor: 'transparent',
			borderWidth: 1,
			draggable: true,
			dragHandler: 'icon',
			highlightPlot: true,
			minimize: true,
			icon: { lineColor: '#a5a5a5' },
			item: { fontColor: '#a5a5a5' },
			header: {
				backgroundColor: 'transparent',
				bold: false,
				borderBottom: '1px solid #8c8c8c',
				fontColor: '#a5a5a5',
				text: 'Legend',
			},
			marker: {
				borderColor: 'transparent',
				borderRadius: '3px',
				type: 'inherit',
			},
		},
		backgroundColor: 'transparent',
		crosshairX: {
			exact: true,
			lineColor: '#8c8c8c',
			scaleLabel: {
				alpha: 0.6,
				backgroundColor: '#8c8c8c',
				borderColor: 'transparent',
				borderRadius: '5px',
				fontColor: '#ffffff',
				fontWeight: 'bold',
				textAlpha: 1,
			},
			plotLabel: { visible: false },
		},
		crosshairY: {
			exact: true,
			lineColor: '#8c8c8c',
			scaleLabel: {
				alpha: 0.6,
				backgroundColor: '#8c8c8c',
				borderColor: 'transparent',
				borderRadius: '5px',
				fontColor: '#ffffff',
				fontWeight: 'bold',
				textAlpha: 1,
			},
		},
		plotarea: { marginLeft: 'dynamic', adjustLayout: true },
		zoomSnap: true,
		zoom: {
			backgroundColor: '#00BFA5',
			borderColor: 'transparent',
			borderWidth: 1,
			shared: true,
		},
		title: {
			'margin-bottom': 10,
			'margin-left': 0,
			'margin-right': 0,
			'margin-top': 10,
			fontSize: 16,
			fontWeight: 'normal',
			position: '0% 0%',
		},
		scaleX: {
			guide: { alpha: 0.3, lineColor: '#8c8c8c' },
			item: {
				fontColor: '#a5a5a5',
				fontSize: scaleItemFontSize(1),
				maxChars: 10,
			},
			label: {
				fontColor: SCALE_LABEL_FONT_COLOR,
				fontFamily: DEFAULT_ITEM_FONT_FAMILY,
				fontSize: 14,
				fontStyle: 'normal',
				fontWeight: 'normal',
			},
			logBase: 10,
			maxItems: 10,
			thousandsSeparator: ',',
		},
		scaleY: {
			guide: { alpha: 0.3, lineColor: '#8c8c8c' },
			item: { fontColor: '#a5a5a5', fontSize: scaleItemFontSize(1) },
			label: {
				fontColor: SCALE_LABEL_FONT_COLOR,
				fontFamily: DEFAULT_ITEM_FONT_FAMILY,
				fontSize: 14,
				fontStyle: 'normal',
				fontWeight: 'normal',
			},
			logBase: 10,
			minorTicks: 10,
			thousandsSeparator: ',',
			offsetEnd: DEFAULT_Y_OFFSET_END,
		},
		// selectionTool: {
		// 	// TODO these customization has no effect, check with zingchart team to make it possible
		// 	mask: {
		// 		alpha: 0.3,
		// 		backgroundColor: rgbaToRGB(opacityColorsArray[0].full),
		// 		borderColor: rgbaToRGB(opacityColorsArray[0].full),
		// 		borderWidth: 2,
		// 	},
		// },
	},
};

/** Allows only zooming when neither alt shift are selected, alt and shift are reserved for selection events */
export const ZOOM_EVENTS = () => ({
	beforezoom: (p) => !(p.ev.altKey || p.ev.shiftKey),
	'zingchart.plugins.selection-tool.beforeselection': (p) => p.ev.altKey || p.ev.shiftKey,
});
