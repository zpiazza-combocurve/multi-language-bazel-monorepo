import { MultipleSegments } from '@combocurve/forecast/models';
import { format } from 'date-fns';
import { useMemo } from 'react';

import { DebouncedValue, Zingchart } from '@/components';
import { ZingchartProps } from '@/components/Zingchart';
import { WithZingchartSelection, withZingchartSelection } from '@/components/Zingchart/selection';
import { useDerivedState } from '@/components/hooks/useDerivedState';
import { MenuItem, Select } from '@/components/v2';
import { getAxisBoundary } from '@/forecasts/charts/components/helpers';
import { MTD_DENOM } from '@/forecasts/charts/forecastChartHelper';
import { ChartSettings } from '@/forecasts/charts/useChartSettings';
import { isDevelopmentRoute } from '@/helpers/env';
import { calculatePercentile, getMinMax, mean } from '@/helpers/math';
import { chartHoverColor } from '@/helpers/theme';
import { fields as types } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { TC_ratio_predict } from '@/type-curves/shared/fit-tc/daily-helpers';

import { ColorBySeriesType, useTypeCurveZingchartProps } from './tcZingchartProps';

export {
	DEFAULT_NORMALIZATION_CHART_SETTINGS,
	DEFAULT_NORMALIZATION_X_MAX_ITEMS,
	DEFAULT_NORMALIZATION_X_MIN_ITEMS,
} from './constants';

const multiSeg = new MultipleSegments();

export const getHeadersKeyByType = (t) =>
	Object.entries(types)
		.filter(([, { type }]) => type === t)
		.map(([key]) => key);

// all keys that are the same across all phases
const COMMON_KEYS = {
	aveNoFst: '#AA51D9',
	average: '#FD9559',
	count: '#59351F',
	cum: '#FD9559',
	p10: '#B3693F',
	p50: '#FDD5BE',
	p50NoFst: '#DEA4FC',
	p90: '#8C5331',
	sum: '#FD9559',
};

export const CHART_COLORS = {
	oil: {
		...COMMON_KEYS,
		bestFit: '#98D9C8',
		crossplot: '#12C498',
		eur: '#12C498',
		eurDistribution: '#12C498',
		P10Fit: '#0C8063',
		P50Fit: '#12C498',
		P90Fit: '#074D3B',
		peakRate: '#12C498',
	},
	gas: {
		...COMMON_KEYS,
		bestFit: '#F99A95',
		crossplot: '#F9534B',
		eur: '#F9534B',
		eurDistribution: '#F9534B',
		P10Fit: '#802B27',
		P50Fit: '#F9534B',
		P90Fit: '#4D1A17',
		peakRate: '#F9534B',
	},
	water: {
		...COMMON_KEYS,
		bestFit: '#99BEDA',
		crossplot: '#228ADA',
		eur: '#228ADA',
		eurDistribution: '#228ADA',
		P10Fit: '#186199',
		P50Fit: '#228ADA',
		P90Fit: '#104166',
		peakRate: '#228ADA',
	},
};

export const PROBIT_MODEL_COLORS = {
	P10Fit: '#585858',
	P50Fit: '#7D7D7D',
	P90Fit: '#ABABAB',
};

export const BACKGROUND_WELL_COLORS = {
	dark: '#404040',
	light: '#DEDEDE',
};

export const P_SERIES_LINE_STYLES = {
	P10: 'solid',
	P50: 'solid',
	P90: 'solid',
	best: 'dashed',
};

function formatValue(v, unit?) {
	if (typeof v === 'number') {
		const formatted = Math.round(v);
		if (unit) {
			return `${formatted} ${unit}`;
		}
		return formatted;
	}
	return v;
}

function formatDate(value) {
	if (value) {
		return format(new Date(value), 'yyyy-MM-dd');
	}
	return value;
}

// TODO: maybe move this function, it is now used in both TC and forecast
export function formatHeaders(headerValues) {
	if (!headerValues) {
		return 'N/A';
	}

	const {
		well_name,
		well_number,
		current_operator,
		first_prod_date,
		perf_lateral_length,
		total_fluid_per_perforated_interval,
		total_proppant_per_perforated_interval,
	} = headerValues;

	return [
		well_name,
		well_number,
		formatDate(first_prod_date),
		formatValue(current_operator),
		formatValue(perf_lateral_length, 'FT'),
		formatValue(total_proppant_per_perforated_interval, ' LB/FT'),
		formatValue(total_fluid_per_perforated_interval, ' BBL/FT'),
	]
		.filter(Boolean)
		.join(' | ');
}

/** @param {Record<string, any>} headerValues */
export const getSingleHeaderInfo = (headerValues) => {
	return { dataHeaderInfo: formatHeaders(headerValues) };
};

export function getChartHeaderInfoFromHeaderData(headerData) {
	return { dataHeaderInfo: headerData.map((headers) => formatHeaders(headers)) };
}

export function getChartHeaderInfo(wells, headerMap) {
	if (!headerMap) {
		return { dataHeaderInfo: 'N/A' };
	}
	return { dataHeaderInfo: wells.map((id) => formatHeaders(headerMap.get(id))) };
}

export const getTcTooltipStyles = (color = chartHoverColor) => ({
	backgroundColor: color,
	color: '#FFFFFF',
	fontSize: '9',
	padding: 5,
	text: '%plot-text &mdash; %node-value',
	textAlign: 'left',
	visible: true,
});

export const tcTooltip = () => {
	return {
		...getTcTooltipStyles(),

		// overwrite default text with data-header-info
		text: '%data-header-info',
	};
};

const getUserLines = (matrix, dataPartIdx) => {
	// since it's a matrix all rows have the same length
	const length = matrix[0]?.length ?? 0;
	const width = matrix.length;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const min: any[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const max: any[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const colAverage: any[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const average: any[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const colMedian: any[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const median: any[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const colWellsP10: any[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const wellsP10: any[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const colWellsP90: any[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const wellsP90: any[] = [];

	for (let i = 0; i < length; i++) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const forecastColumn: any[] = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const prodColumn: any[] = [];
		for (let j = 0; j < width; j++) {
			forecastColumn.push(matrix[j][i]);
			const [dataStart, dataEnd, hasData] = dataPartIdx[j];

			if (hasData && i >= dataStart && i < dataEnd) {
				// left inlcusive and right exclusive is the dataPartIdx
				prodColumn.push(matrix[j][i]);
			}
		}

		const [colMin, colMax] = getMinMax(forecastColumn);
		min.push(colMin);
		max.push(colMax);

		average.push(mean(forecastColumn));
		colAverage.push(mean(prodColumn));

		wellsP10.push(calculatePercentile(forecastColumn, [10])[0]);
		colWellsP10.push(calculatePercentile(prodColumn, [10])[0]);

		median.push(calculatePercentile(forecastColumn, [50])[0]);
		colMedian.push(calculatePercentile(prodColumn, [50])[0]);

		wellsP90.push(calculatePercentile(forecastColumn, [90])[0]);
		colWellsP90.push(calculatePercentile(prodColumn, [90])[0]);
	}

	return {
		average,
		colAverage,
		colMedian,
		colWellsP10,
		colWellsP90,
		max,
		median,
		min,
		wellsP10,
		wellsP90,
	};
};

export const shiftNonMatchingSegments = (segments, fitAlign) => {
	if (!segments?.length) {
		return [];
	}

	let deltaT = 0;
	if (fitAlign === 'align') {
		const firstSegment = segments[0];
		deltaT = -firstSegment.start_idx;
	} else if (fitAlign === 'noalign') {
		const [peakIdx] = segments.reduce(
			([curIdx, curV], segment) => {
				let ret = [curIdx, curV];
				if (segment.q_start >= ret[1]) {
					ret = [segment.start_idx, segment.q_start];
				}

				if (segment.q_end >= ret[1]) {
					ret = [segment.end_idx, segment.q_end];
				}
				return ret;
			},
			[segments[0].start_idx, segments[0].q_start]
		);

		deltaT = -peakIdx;
	}

	return multiSeg.shiftSegmentsIdx({ inputSegments: segments, deltaT });
};

export { getUserLines };

export function getFitArr({ timeArrLength, segments, phaseType, basePhaseFit, basePhaseSeries }) {
	const hand_written_idx = [...Array(timeArrLength).keys()].map(
		(key) => Math.round(key * MTD_DENOM) + segments[0].start_idx + 15
	);

	return phaseType === 'rate'
		? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		  multiSeg.predict({ idxArr: hand_written_idx, segments, toFill: 0 as any })
		: // eslint-disable-next-line new-cap -- TODO eslint fix later
		  TC_ratio_predict(hand_written_idx, segments, basePhaseFit[basePhaseSeries].segments);
}

export const TC_DEFAULT_LEGEND = {
	layout: 'vertical',
	maxItems: 8,
	overflow: 'scroll',
};

export const useTcChartMinMax = ({
	cumMax,
	cumMin,
	maxProdTime: maxProdTimeIn,
	xType,
	yearsBefore,
	yearsPast,
	yMax: yMaxIn,
	yMin: yMinIn,
}: Pick<ChartSettings, 'cumMax' | 'cumMin' | 'yearsBefore' | 'yearsPast' | 'yMax' | 'yMin'> & {
	maxProdTime?: number;
	xType?: string;
}) => {
	const [xMinOut, xMaxOut, yMinOut, yMaxOut] = useMemo(() => {
		// currently the time is always scoped around Day 0
		const maxProdTime = maxProdTimeIn ?? 0;

		const xMin = getAxisBoundary({
			axis: 'x',
			boundary: 'min',
			axisProps: { maxProdTime, xType, yearsBefore, value: cumMin },
		});
		const xMax = getAxisBoundary({
			axis: 'x',
			boundary: 'max',
			axisProps: { maxProdTime, xType, yearsPast, value: cumMax },
		});
		const yMin = getAxisBoundary({ axis: 'y', boundary: 'min', axisProps: { value: yMinIn } });
		const yMax = getAxisBoundary({ axis: 'y', boundary: 'max', axisProps: { value: yMaxIn } });

		return [xMin, xMax, yMin, yMax];
	}, [cumMax, cumMin, maxProdTimeIn, xType, yMaxIn, yMinIn, yearsBefore, yearsPast]);

	return Object.assign([xMinOut, xMaxOut, yMinOut, yMaxOut], {
		xMin: xMinOut,
		xMax: xMaxOut,
		yMin: yMinOut,
		yMax: yMaxOut,
	});
};

export const getTcDefaultGui = ({ disableXLSX, disablePDF }: { disableXLSX?: boolean; disablePDF?: boolean } = {}) => {
	return {
		gui: {
			behaviors: [
				{
					id: 'DownloadPDF',
					enabled: disablePDF ? 'none' : 'all',
				},
				{ id: 'DownloadCSV', enabled: 'none' },
				{ id: 'DownloadSVG', enabled: 'none' },
				{
					id: 'DownloadXLS',
					text: 'Download XLS',
					enabled: disableXLSX ? 'none' : 'all',
					'custom-function': 'export2excel()',
				},
				{ id: 'HideGuide', enabled: 'none' },
				{ id: 'LinScale', enabled: 'none' },
				{ id: 'LogScale', enabled: 'none' },
				{ id: 'Print', enabled: 'none' },
				{ id: 'Reload', enabled: 'none' },
				{ id: 'SaveAsImagePNG', enabled: 'none' },
				{ id: 'ViewAll', enabled: 'none' },
				{ id: 'ViewDataTable', enabled: 'none' },
				{ id: 'ViewSource', enabled: isDevelopmentRoute() ? 'all' : 'none' },
				{ id: 'ZoomIn', enabled: 'none' },
				{ id: 'ZoomOut', enabled: 'none' },
			],
		},
		noData: { text: 'No Data' },
		plotarea: { marginRight: '35rem' },
	};
};

type TcZingChartProps = WithZingchartSelection<ZingchartProps> & {
	delay?: number;
	// disables the excel download
	disableXLSX?: boolean;
	// disable CSV download
	disableCSV?: boolean;
	disablePDF?: boolean;
};

const ZingchartWithSelection = withZingchartSelection(Zingchart);

/**
 * Wrapper over Zingchart component:
 *
 * - Disabled some of the contextual actions
 * - Added selection
 * - Debounced by 250ms
 */
export const TcZingChart = ({
	data,
	delay = 500,
	disablePDF,
	disableXLSX,
	useColorBy,
	colorBySeriesType,
	useExcludedWells,
	...props
}: TcZingChartProps & {
	selectionPlotsIds?;
	useColorBy?: boolean;
	colorBySeriesType?: ColorBySeriesType;
	useExcludedWells?: boolean;
}) => {
	const { data: customData, events } = useTypeCurveZingchartProps(data, {
		disablePDF,
		disableXLSX,
		useColorBy,
		colorBySeriesType,
		useExcludedWells,
	});

	return (
		<DebouncedValue value={customData} delay={delay}>
			{(debouncedData) => (
				<ZingchartWithSelection data={debouncedData} viewAllOnMinMaxChange {...props} events={events} />
			)}
		</DebouncedValue>
	);
};

/** `ChartSelection` component helper */
export function useChartSelection<V>({ initial, optionMap }: { initial: string; optionMap: Record<string, V> }) {
	const [selected, setSelected] = useDerivedState(initial);
	const options = useMemo(() => Object.keys(optionMap), [optionMap]);
	const chartSelectionProps = { options, selected, setSelected };
	const selectedValues = useMemo(() => optionMap[selected] ?? optionMap[initial], [initial, optionMap, selected]);
	return { chartSelectionProps, ...selectedValues };
}

// TODO: Prevent hover styles on select and maybe improve styles
export function ChartSelection({ options, selected, setSelected, ...props }) {
	return (
		<Select
			disableUnderline
			value={selected}
			onChange={(e) => setSelected(e.target.value)}
			MenuProps={{
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'left',
				},
				transformOrigin: {
					vertical: 'top',
					horizontal: 'left',
				},
			}}
			{...props}
		>
			{options.map((el) => (
				<MenuItem key={el} value={el}>
					{el.toUpperCase().replace(/_/g, ' ')}
				</MenuItem>
			))}
		</Select>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const validateCumData = (cumData: any) => {
	const { idx, cum_subind } = cumData ?? {};
	if (!idx || !cum_subind) {
		return false;
	}

	return true;
};

// /** @deprecated Use material-ui */
// export function ChartSelection({ options, selected, setSelected, ...props }) {
// 	return (
// 		<SelectField
// 			{...props}
// 			value={selected}
// 			onChange={(value) => setSelected(value)}
// 			menuItems={options.map((el) => ({
// 				value: el,
// 				label: el.toUpperCase().replace(/_/g, ' '),
// 			}))}
// 		/>
// 	);
// }
