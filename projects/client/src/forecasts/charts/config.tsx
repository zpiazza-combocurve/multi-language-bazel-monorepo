import { useMemo } from 'react';

import { Plot } from '@/components/PlotZingchart';
import { capitalize } from '@/helpers/text';
import {
	convertIdxToMilli,
	forecastSeriesColors,
	lineSeriesConfig,
	phaseColors,
	phaseColorsEditing,
	phases,
	scatterSeriesConfig,
} from '@/helpers/zing';
import { fields as types } from '@/inpt-shared/display-templates/forecast-data/forecast-types.json';
import { fields as units } from '@/inpt-shared/display-templates/segment-templates/seg_units.json';

import { genSeriesData } from './forecastChartHelper';

const unitLabels = {
	oil: units.oil.q.unitLabel,
	gas: units.gas.q.unitLabel,
	water: units.water.q.unitLabel,
};

export const phaseYLabels = {
	all: `Oil & Water (${unitLabels.oil}), Gas (${unitLabels.gas})`,
	...unitLabels,
};

function getProductionValues({
	index = false,
	idxKey = 'index',
	relative = false,
	phase = 'oil',
	production,
}: {
	index: boolean;
	idxKey: string;
	relative: boolean;
	phase: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	production: Record<string, any>;
}) {
	if (!production || !production[phase] || !production[idxKey]) {
		return [];
	}

	return production[phase].map((prod, i) => {
		const curIdx = production[idxKey][i];
		let time;
		if (index) {
			if (relative) {
				time = curIdx - production[idxKey][0] + 1;
			} else {
				time = curIdx;
			}
		} else {
			time = convertIdxToMilli(curIdx);
		}

		return [time, prod];
	});
}

type ForecastSeriesValues = {
	chartResolution: number;
	idxKey: string;
	index: boolean;
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	P_dict: Record<string, any>;
	relative: boolean;
	yearsBefore: number | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	production: Record<string, any>;
};

function getForecastSeriesValues({
	chartResolution = 10,
	idxKey = 'index',
	index = false,
	name = 'P50',
	P_dict = {},
	relative = false,
	yearsBefore = null,
	production,
}: ForecastSeriesValues) {
	if (!P_dict[name]) {
		return [];
	}

	const { segments } = P_dict[name];
	if (!segments?.length) {
		return [];
	}

	const production_index = production?.[idxKey];

	const beginIdx = Number.isFinite(yearsBefore)
		? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		  production_index?.[production_index?.length - 1] - yearsBefore! * 365 ?? 0
		: 0;

	const relativeIdx = production?.[idxKey]?.[0];

	return genSeriesData({
		beginIdx,
		chartResolution,
		index,
		relative,
		relativeIdx,
		segments,
	});
}

/**
 * Purpose: Outputs an array of arrays representing each series in a P_dict
 *
 * # Inputs:
 *
 * - Color: color of the series as string (hex, rgb, rgba, etc.)
 * - ChartResolution: resolution of the series curve. The lower the values, the higher the resolution
 * - IdxKey: key of the 'index' field for production (changes from time to time due to the python side)
 * - Names: an array of names to look up on the P_dict e.g. P10, P50, P90, best
 * - P_dict: an object containing the forecast parameters for the named keys
 * - Prefix: text prefix for display in the legend
 * - Production: well production data, structure must include the required phase and index (e.g. { oil, gas, water, index
 *   })
 * - Years: years to forecast past the end of production
 */

// Zingchart components
const getCustomProps = ({ type, ...rest }) => {
	if (type === 'line') {
		return lineSeriesConfig(rest);
	}
	if (type === 'scatter') {
		return scatterSeriesConfig(rest);
	}
	return {};
};

type ProductionPlotProps = {
	index?: boolean;
	idxKey?: string;
	lineScatter?: boolean;
	phase?: string;
	relative?: boolean;
	tooltip?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	prodFreq?: any;
	yearsBefore?: number | null;
	yearsPast?: number | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	production: Record<string, any>;
};

export function ProductionPlot({
	index = false,
	idxKey = 'index',
	lineScatter = true,
	phase = 'oil',
	relative = false,
	tooltip = true,
	production,
}: ProductionPlotProps) {
	const color = phaseColors[phase];

	const values = useMemo(
		() => getProductionValues({ idxKey, index, phase, production, relative }),
		[idxKey, index, phase, production, relative]
	);

	// TODO make sure zIndex is applied correctly
	// zIndex: 1, // production should always be below forecast
	return (
		<Plot
			text={`${capitalize(phase)} Production`}
			type={lineScatter ? 'line' : 'scatter'}
			values={values}
			{...getCustomProps({
				type: lineScatter ? 'line' : 'scatter',
				color,
				lineWidth: '1px',
				markerSize: '2px',
				size: '2px',
				tooltip,
				showMarkers: !!lineScatter,
			})}
		/>
	);
}

export function ProductionSeries({ phase, ...props }: ProductionPlotProps) {
	if (phase === 'all') {
		return (
			<>
				{phases.map(({ value }) => (
					<ProductionPlot key={value} {...props} phase={value} />
				))}
			</>
		);
	}
	return <ProductionPlot {...props} phase={phase} />;
}

const EMPTY_OBJECT = {};

type ForecastPlotProps = {
	color?: string | null;
	chartResolution?: number;
	forecastType: string;
	idxKey?: string;
	index?: boolean;
	name?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	P_dict: Record<string, any>;
	prefix?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	production: Record<string, any>;
	relative?: boolean;
	resolution: string;
	yearsBefore?: number | null;
	yearsPast?: number | null;
};

export function ForecastPlot({
	color: inputColor,
	chartResolution = 10,
	forecastType,
	idxKey = 'index',
	index = false,
	name = 'P50',
	P_dict = EMPTY_OBJECT,
	prefix = '',
	production,
	relative = false,
	resolution,
	yearsBefore = null,
}: ForecastPlotProps) {
	const color = inputColor ?? forecastSeriesColors[name];
	const values = useMemo(
		() =>
			getForecastSeriesValues({
				chartResolution,
				idxKey,
				index,
				name,
				P_dict,
				relative,
				yearsBefore,
				production,
			}),
		[P_dict, chartResolution, idxKey, index, name, production, relative, yearsBefore]
	);

	let text = `${resolution === 'monthly' ? 'M' : 'D'}/${types[forecastType]?.shortLabel || 'N/A'} - ${capitalize(
		name
	)}`;

	if (prefix.length) {
		text = `${capitalize(prefix)} - ${text}`;
	}

	return (
		<Plot
			text={text}
			type='line'
			values={values}
			{...getCustomProps({
				type: 'line',
				alpha: 1,
				color: color || forecastSeriesColors[name],
				lineWidth: '3px',
				tooltip: true,
			})}
			dataIgnoreSelection
			// 	zIndex: 10, // TODO check if this is a problem: forecast should always be above production
		/>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const hasAnySegment = (pDict: Record<string, any>) => !!pDict?.segments?.length;

type ForecastPSeriesProps = ForecastPlotProps & { names: string[] };

export function ForecastPSeries({ color, names: propNames, P_dict, ...props }: ForecastPSeriesProps) {
	const names = propNames.length ? propNames : Object.keys(P_dict);

	// HACKY: potentially adjust later; following the flow where empty array is equal to all keys;
	const inputColor = propNames.length !== 1 ? null : color;
	return (
		<>
			{names
				.filter((name) => hasAnySegment(P_dict?.[name]))
				.map((name) => (
					<ForecastPlot key={name} P_dict={P_dict} {...props} name={name} color={inputColor} />
				))}
		</>
	);
}

type ForecastSeriesProps = {
	phase: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecastData: Record<string, any>;
	names: string[];
	color?: string | null;
	chartResolution?: number;
	index?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	production: Record<string, any>;
	relative?: boolean;
	resolution: string;
	yearsBefore?: number | null;
	yearsPast?: number | null;
};

export function ForecastSeries({ phase, forecastData, ...props }: ForecastSeriesProps) {
	return (
		<>
			{(phase === 'all' ? phases : [{ value: phase }]).map(({ value: curPhase }) => (
				<ForecastPSeries
					key={curPhase}
					forecastType={forecastData[curPhase].forecastType}
					P_dict={forecastData[curPhase].P_dict}
					color={phaseColorsEditing[curPhase]}
					prefix={curPhase}
					{...props}
				/>
			))}
		</>
	);
}
