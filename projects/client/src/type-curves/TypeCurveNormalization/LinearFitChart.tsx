import { faCog } from '@fortawesome/pro-regular-svg-icons';
import { useTheme } from '@material-ui/core';
import { useEffect, useMemo } from 'react';

import { Placeholder, SelectionActions } from '@/components';
import { useDerivedState } from '@/components/hooks';
import { MenuIconButton } from '@/components/v2/menu';
import Autocomplete from '@/components/v2/misc/Autocomplete';
import ForecastChartContainer from '@/forecasts/charts/components/ForecastChartContainer';
import { TC_SHORT_Y_LABEL_CHARS } from '@/forecasts/charts/components/graphProperties';
import { useDebouncedValue } from '@/helpers/debounce';
import { labelWithUnit } from '@/helpers/text';
import { deepMerge } from '@/helpers/utilities';
import {
	ColorBySeriesObject,
	GRAY_2,
	ORANGE_1,
	PHASE_HOVER_COLOR,
	PINK_1,
	ZingchartData,
	ZingchartSerie,
	lineSeriesConfig,
	phaseColors,
	scatterSeriesConfig,
} from '@/helpers/zing';
import { MAX_WELLS_IN_TYPECURVE } from '@/inpt-shared/constants';
import { getConvertFunc } from '@/inpt-shared/helpers/units';
import { Card } from '@/layouts/CardsLayout';
import { CATEGORICAL_HEADERS, getHeaderValue, getInput } from '@/type-curves/charts/HeaderChart';

import {
	DEFAULT_NORMALIZATION_CHART_SETTINGS,
	DEFAULT_NORMALIZATION_X_MAX_ITEMS,
	DEFAULT_NORMALIZATION_X_MIN_ITEMS,
	TcZingChart,
	getChartHeaderInfo,
	getChartHeaderInfoFromHeaderData,
	tcTooltip,
	useTcChartMinMax,
} from '../charts/shared';
import { genTCScaleX } from '../shared/tcChartConfig';
import { getAbbreviatedHeaderLabel } from '../shared/useHeaders';
import { NORMALIZATION_TYPE, getChainUnits } from '../shared/utils';

const guideSeriesConfig = ({ color, minX, minY, text, x, y }) => {
	return {
		...lineSeriesConfig({ color, forcedTooltip: true }),
		dataIgnoreSelection: true,
		values: [
			[minX, y],
			[x, y],
			[x, minY],
		],
		lineStyle: 'dashed',
		lineWidth: 2,
		marker: {
			backgroundColor: color,
			alpha: 0.8,
			size: '3px',
		},
		text,
	};
};

function getLine({ minX, maxX, length = 21, fn }) {
	return Array.from({ length }, (_, i) => fn((i / (length - 1)) * (maxX - minX) + minX));
}

/** NOTE: `points` is expected to be sorted in ascending order by x value */
export function getLinearFitChartData({
	aValue,
	base,
	bValue,
	colorBy,
	eurMap,
	headersMap,
	phase,
	points,
	targetX,
	type,
	userXMax,
	userXMin,
}) {
	const { appUnit, userUnit } = getChainUnits(base.y);
	const convert = getConvertFunc(appUnit, userUnit);

	let minX = 0;
	let maxX = Infinity;

	if (points.length > 0) {
		minX = userXMin ?? Math.floor(Math.min(points[0].point[0], targetX));
		maxX = userXMax ?? Math.ceil(Math.max(points[points.length - 1].point[0], targetX || 0));
	}

	const headerData = points.map(({ header }) => header);

	function scatterWells() {
		const series: ZingchartSerie[] = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const retWellList: any[] = [];

		if (!colorBy) {
			series.push({
				...scatterSeriesConfig({ color: phaseColors[phase] }),
				...getChartHeaderInfoFromHeaderData(headerData),
				id: 'wells',
				values: points.map(({ point }) => [point[0], convert(point[1])]),
				text: `${getChainUnits(base.y).label} vs. ${getChainUnits(base.x).label}`,
				hoverMarker: {
					backgroundColor: PHASE_HOVER_COLOR,
					type: 'circle',
				},
				maxTrackers: MAX_WELLS_IN_TYPECURVE,
				tooltip: tcTooltip(),
				zIndex: 10,
			});
			retWellList.push(points.map(({ header: { _id } }) => _id));
		} else {
			const groupedSeries: ColorBySeriesObject = {};
			points.forEach(({ header: { _id }, point }) => {
				const colorByValue =
					getHeaderValue({
						wellId: _id,
						header: colorBy,
						convert: getInput,
						headersMap,
						eurMap,
					}) ?? 'N/A';

				if (!groupedSeries[colorByValue]) {
					groupedSeries[colorByValue] = {
						text: colorByValue,
						type: 'scatter',
						values: [],
						wells: [],
						tooltip: tcTooltip(),
						colorByValue,
					};
				}
				groupedSeries[colorByValue].values.push([point[0], convert(point[1])]);
				groupedSeries[colorByValue].wells.push(_id);
			});
			Object.values(groupedSeries).forEach((thisSeries) => {
				const newObjectValues = {
					...getChartHeaderInfo(thisSeries.wells, headersMap),
				};
				Object.assign(thisSeries, newObjectValues);
				retWellList.push(thisSeries.wells);
				series.push(thisSeries);
			});
		}
		return [series, retWellList];
	}

	function plots1To1() {
		return points
			.map(({ point }) => {
				const [x, y] = point;

				// don't draw lines for scatter points outside the current view
				if (!Number.isFinite(x) || !Number.isFinite(y) || (Number.isFinite(userXMax) && x > userXMax)) {
					return [];
				}

				let maxY;
				if (x === 0) {
					maxY = y;
				} else {
					const slope = y / x;
					maxY = slope * maxX;
				}

				return {
					alpha: 0.5,
					borderColor: GRAY_2,
					borderWidth: 1,
					type: 'poly',
					valueRange: true,
					range: [
						[0, 0],
						[maxX, convert(maxY)],
						[0, 0],
					],
				};
			})
			.filter(Boolean);
	}

	function guideSeries() {
		if (!(Number.isFinite(aValue) && Number.isFinite(bValue) && points.length > 0)) {
			return [];
		}

		const fitFn =
			type === NORMALIZATION_TYPE.linear.value
				? (x: number) => aValue * x + bValue
				: (x: number) => aValue * x ** bValue;

		const getFitPoint = (x: number) => [x, convert(fitFn(x))];
		const output = [
			{
				...lineSeriesConfig({ color: ORANGE_1 }),
				lineWidth: 2,
				text: 'Fit',
				values: getLine({
					minX,
					maxX,
					fn: getFitPoint,
					length: type === NORMALIZATION_TYPE.linear.value ? 2 : 101,
				}),
			},
		];

		if (Number.isFinite(targetX)) {
			output.unshift(
				guideSeriesConfig({
					minX,
					color: PINK_1,
					minY: 0,
					text: 'Target',
					x: targetX,
					y: convert(fitFn(targetX)),
				})
			);
		}

		return output;
	}
	const [wells, wellIds] = scatterWells();

	const output: [ZingchartData, string[][]] = [
		{
			type: 'mixed',
			series: [
				wells,
				type === NORMALIZATION_TYPE.linear.value || type === NORMALIZATION_TYPE.power_law.value
					? guideSeries()
					: [],
			].flat(),
			legend: {
				visible:
					type === NORMALIZATION_TYPE.linear.value ||
					type === NORMALIZATION_TYPE.power_law.value ||
					Boolean(colorBy),
			},
			scaleY: { markers: type === NORMALIZATION_TYPE['1_to_1'].value ? plots1To1() : [] },
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			selectType: 'multi-select',
		},
		wellIds,
	];

	return output;
}

function formatLabel(axisBase) {
	const { label, userUnit: unit } = getChainUnits(axisBase, { abbreviated: true });
	return labelWithUnit(label, unit?.toUpperCase());
}

export function LinearFitChartRender({
	aValue: aValue_,
	base,
	bValue: bValue_,
	chartSettings,
	colorBy,
	eurMap,
	headersMap,
	loading,
	phase: phase_,
	points: points_,
	selection,
	setXAxisLabel,
	setYAxisLabel,
	targetX: targetX_,
	type,
}) {
	const {
		palette: { charts },
	} = useTheme();

	const [aValue, bValue, phase, points, targetX] = useDebouncedValue(
		[aValue_, bValue_, phase_, points_, targetX_],
		1000
	);
	const { cumMin, cumMax, xAxis, yMin: settingsYMin, yMax: settingsYMax } = chartSettings;
	const { xMin, xMax, yMin, yMax } = useTcChartMinMax({
		xType: xAxis,
		cumMin,
		cumMax,
		yMin: settingsYMin,
		yMax: settingsYMax,
	});

	const [cdata, plotsWellIds] = useMemo(() => {
		if (loading || !points.length) {
			return [{ type: 'mixed', series: [{}], selectType: 'multi-select' }, []];
		}

		const [cdata, wellIds] = getLinearFitChartData({
			aValue,
			base,
			bValue,
			colorBy,
			eurMap,
			headersMap,
			phase,
			points,
			targetX,
			type,
			userXMax: xMax,
			userXMin: xMin,
		});

		return [
			deepMerge(cdata, {
				scaleY: {
					minValue: yMin,
					maxValue: yMax,
				},
				scaleX: genTCScaleX({
					time: false,
					minValue: xMin,
					maxValue: xMax,
				}),
				plot: {
					hoverMarker: { backgroundColor: charts.hovered },
					selectedMarker: { backgroundColor: charts.selected },
				},
			}),
			wellIds,
		];
	}, [
		aValue,
		bValue,
		base,
		charts,
		colorBy,
		eurMap,
		headersMap,
		loading,
		phase,
		points,
		targetX,
		type,
		xMax,
		xMin,
		yMax,
		yMin,
	]);

	useEffect(() => {
		if (base?.x && base?.y) {
			setXAxisLabel(formatLabel(base.x));
			setYAxisLabel(formatLabel(base.y));
		}
	}, [base?.x, base?.y, setXAxisLabel, setYAxisLabel]);

	return (
		<TcZingChart
			data={cdata}
			modules='selection-tool'
			selection={Boolean(plotsWellIds.length) && selection}
			selectionPlotsNodesIds={plotsWellIds}
			useColorBy={Boolean(colorBy)}
			colorBySeriesType='scatter'
		/>
	);
}

export function LinearFitChart({
	aValue,
	base,
	bValue,
	colorBy: parentColorBy = null,
	eurQuery,
	headersQuery,
	phase,
	points,
	targetX,
	type,
	loading,
	selection,
	showCount,
	showActions,
	noHeader = false,
	className,
}) {
	const { isLoading: eurLoading, data: eurMap } = eurQuery ?? {};
	const [colorBy, setColorBy] = useDerivedState(parentColorBy);
	return (
		<Card
			disableHeader={noHeader}
			centerHeader='Normalization'
			leftHeader={
				<MenuIconButton tooltipTitle='Options' icon={faCog} color='secondary' size='small' list>
					<Autocomplete
						css={`
							width: calc(100% - 1rem);
							margin: 0 0.5rem;
						`}
						value={colorBy}
						label='Color By'
						options={CATEGORICAL_HEADERS}
						onChange={(ev, newValue) => setColorBy(newValue)}
						getOptionLabel={getAbbreviatedHeaderLabel}
					/>
				</MenuIconButton>
			}
			rightHeader={
				<>
					{showCount && !loading && points && <span>Count: {points.length}</span>}
					{showActions && <SelectionActions selection={selection} clearCurrentActive />}
				</>
			}
			className={className}
		>
			<Placeholder loading={loading || eurLoading} empty={points?.length === 0}>
				<ForecastChartContainer
					chartSettings={DEFAULT_NORMALIZATION_CHART_SETTINGS}
					enableXMinMax
					enableYMinMax
					xMinItems={DEFAULT_NORMALIZATION_X_MIN_ITEMS}
					xMaxItems={DEFAULT_NORMALIZATION_X_MAX_ITEMS}
					render={(renderProps) => (
						<LinearFitChartRender
							{...{
								aValue,
								base,
								bValue,
								colorBy,
								eurMap,
								headersMap: headersQuery?.data,
								loading,
								phase,
								points,
								selection,
								targetX,
								type,
							}}
							{...renderProps}
						/>
					)}
					yLabelChars={TC_SHORT_Y_LABEL_CHARS}
				/>
			</Placeholder>
		</Card>
	);
}
