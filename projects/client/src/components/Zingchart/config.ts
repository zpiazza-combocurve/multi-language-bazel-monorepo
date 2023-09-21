import { isDevelopmentRoute } from '@/helpers/env';
import { rgbaToRGB } from '@/helpers/text';
import {
	DEFAULT_ITEM_FONT_FAMILY,
	DEFAULT_ITEM_FONT_SIZE,
	ORANGE_1,
	PHASE_HOVER_COLOR,
	ZingchartData,
	fastlineSelectedColor,
	mergeZingchartConfigs,
	opacityColorsArray,
} from '@/helpers/zing';

export const DEFAULT_ZINGCHART_BEHAVIORS = [
	{ id: 'DownloadCSV', enabled: 'none' },
	{ id: 'DownloadSVG', enabled: 'none' },
	{ id: 'DownloadXLS', text: 'Download XLS', enabled: 'all', 'custom-function': 'export2excel()' },
	{ id: 'LinScale', enabled: 'none' },
	{ id: 'LogScale', enabled: 'none' },
	{ id: 'Print', enabled: 'none' },
	{ id: 'Reload', enabled: 'none' },
	{ id: 'SaveAsImagePNG', enabled: 'none' },
	{ id: 'ViewDataTable', enabled: 'none' },
	{ id: 'ViewSource', enabled: isDevelopmentRoute() ? 'all' : 'none' },
	{ id: 'ZoomIn', enabled: 'none' },
	{ id: 'ZoomOut', enabled: 'none' },
];

export function LITE_CONFIG(): ZingchartData {
	return {
		plot: {
			marker: { size: 3, borderColor: 'transparent', type: 'circle', alpha: 0.8 },
			selectedState: { lineColor: fastlineSelectedColor, lineWidth: 1 },
			selectedMarker: { backgroundColor: fastlineSelectedColor },
			dataAppendSelection: true,
			selectionMode: 'multiple',
			tooltip: {
				visible: false,

				// default palette available if wants to enable tooltip for single charts
				borderColor: 'transparent',
				borderRadius: 5,
				borderWidth: 0,
				'font-size': DEFAULT_ITEM_FONT_SIZE,
				shadow: false,
				thousandsSeparator: ',',
			},
		},
		noData: { text: 'No Data' },
		backgroundColor: 'transparent',
		gui: {
			contextMenu: {
				position: 'left',
				button: { visible: false },
				gear: { backgroundColor: '#a5a5a5' },
			},
			behaviors: DEFAULT_ZINGCHART_BEHAVIORS,
		},
		crosshairX: {
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
		crosshairY: {
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
		plotarea: {
			marginLeft: 'dynamic',
			adjustLayout: true,
		},
		zoomSnap: true,
		zoom: {
			backgroundColor: '#00BFA5',
			borderColor: 'transparent',
			borderWidth: 1,
			shared: true,
		},
		legend: {
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
			icon: { lineColor: '#a5a5a5' },
			item: { fontColor: '#a5a5a5' },
			layout: 'x1',
			marker: {
				borderColor: 'transparent',
				borderRadius: '3px',
				type: 'inherit',
			},
			maxItems: 12,
			minimize: true,
			overflow: 'scroll',
			visible: false,
		},
		scaleX: {
			guide: { alpha: 0.3, lineColor: '#8c8c8c' },
			item: { maxChars: 10 },
			label: {
				fontColor: '#8c8c8c',
				fontFamily: DEFAULT_ITEM_FONT_FAMILY,
				'font-size': DEFAULT_ITEM_FONT_SIZE,
				fontStyle: 'normal',
				fontWeight: 'normal',
			},
			maxItems: 10,
			thousandsSeparator: ',',
			zooming: true,
		},
		scaleY: {
			angle: -90,
			logBase: 10,
			minorTicks: 10,
			thousandsSeparator: ',',
			zooming: true,
			label: {
				fontColor: '#8c8c8c',
				fontFamily: DEFAULT_ITEM_FONT_FAMILY,
				'font-size': DEFAULT_ITEM_FONT_SIZE,
				fontStyle: 'normal',
				fontWeight: 'normal',
			},
			guide: { alpha: 0.3, lineColor: '#8c8c8c' },
		},
		selectionTool: {
			mask: {
				alpha: 0.3,
				backgroundColor: rgbaToRGB(opacityColorsArray[0].full),
				borderColor: rgbaToRGB(opacityColorsArray[0].full),
				borderWidth: 2,
			},
		},
		'cc-zoomout-plugin': true,
	};
}

export function FASTLINE_CONFIG(): ZingchartData {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	return mergeZingchartConfigs(LITE_CONFIG(), {
		plot: {
			selectedState: {
				lineColor: fastlineSelectedColor,
				lineWidth: 1,
			},
			highlight: true,
			selectionMode: 'multiple',
			lineWidth: 1,
			hoverState: {
				lineColor: PHASE_HOVER_COLOR,
				lineWidth: 2,
			},
			marker: { visible: true },
			tooltip: {
				visible: true,
				backgroundColor: 'transparent',
				color: ORANGE_1,
				'font-size': DEFAULT_ITEM_FONT_SIZE,
				text: '%plot-text<br>%node-value',
				// TODO [typescript] check why it is failing
				//https://www.zingchart.com/docs/api/json-configuration/graphset/plot/tooltip
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				textAlign: 'left',
				padding: 10,
			},
		},
	});
}

/**
 * Helpers for getting default behavior with some modifications, mostly linear and log scales
 *
 * @example
 * 	getZingchartBehaviors({ linScale: true, logScale: true }); // [...DEFAULT_ZINGCHART_BEHAVIOR, { id: 'LinScale', enabled: 'all' }, {id: 'LogScale', enabled: 'all'}]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function getZingchartBehaviors(values: Record<string, any>) {
	return DEFAULT_ZINGCHART_BEHAVIORS.map((item) => {
		if (item.id in values) {
			return { ...item, enabled: values[item.id] };
		}
		return item;
	});
}
