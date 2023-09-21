import { MultipleSegments } from '@combocurve/forecast/models';
import { useTheme } from '@material-ui/core';
import { cloneDeep, isEqual, map, mapValues, merge } from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import Zingchart from '@/components/Zingchart';
import { useMergedState } from '@/components/hooks';
import { genSeriesData } from '@/forecasts/charts/forecastChartHelper';
import { unitTemplates } from '@/forecasts/shared';
import { capitalize } from '@/helpers/text';
import { getConvertFunc } from '@/helpers/units';
import {
	PROXIMITY_TARGET_WELL_COLOR,
	TEAL_1,
	genScaleY,
	lineSeriesConfig,
	phaseColors as zingPhaseColors,
} from '@/helpers/zing';
import { isValidPDict } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/helpers';
import { getHeaderValue, getInput } from '@/type-curves/charts/HeaderChart';
import { C4_DATA_SERIES_LABELS, FIT_OBJECT } from '@/type-curves/charts/graphProperties';
import {
	BACKGROUND_WELL_COLORS,
	CHART_COLORS,
	P_SERIES_LINE_STYLES,
	TcZingChart,
	getSingleHeaderInfo,
	getTcTooltipStyles,
	getUserLines,
	tcTooltip,
	useTcChartMinMax,
} from '@/type-curves/charts/shared';

import { genTCScaleX } from '../shared/tcChartConfig';
import { RAW_CUM_IDX_ARRAY } from './FitCumChart-v2';

const CHART_RESOLUTION = 30;

const multiSeg = new MultipleSegments();

const EMPTY_BASE_PHASE_DATA = {};

const filterOnes = (value) => value < 0.99 || value > 1.01;

export const useC4ChartState = ({
	alignAdjustedFitSeries: curFitSeries,
	phase,
	resolution,
	showBackground = true,
} = {}) => {
	const [c4State, setC4State] = useMergedState({
		c4RatioShowRate: false,
		showBackgroundOnly: showBackground,
		showDaily: true,
		showExcludedWells: false,
		showDailyRate: true,
	});

	const prevFitSeries = useRef(null);
	const prevPhase = useRef(phase);

	useEffect(() => {
		if (
			prevPhase.current === phase &&
			!isEqual(curFitSeries, prevFitSeries.current) &&
			isValidPDict(curFitSeries)
		) {
			setC4State({ showBackgroundOnly: false });
			prevFitSeries.current = curFitSeries;
		}
		prevPhase.current = phase;
	}, [curFitSeries, phase, setC4State]);

	useEffect(() => {
		if (resolution === 'daily' && !c4State.showDailyRate) {
			setC4State({ showDailyRate: true });
		}
	}, [c4State.showDailyRate, resolution, setC4State]);

	return {
		c4State,
		setC4State,
	};
};

export const { defaultUnitTemplate, dailyUnitTemplate, monthlyUnitTemplate } = unitTemplates;
//used for x-axis conversion
const convertDailyToMonthly = getConvertFunc('D', 'M');

export const generateC4WellSeries = ({
	activeChartSeries,
	colorBy,
	convert,
	displayMonthlyData,
	eurMap,
	excludedIds,
	headersMap,
	includeHeaders,
	noWells,
	phase,
	phaseColors,
	showBackgroundOnly,
	showExcludedWells,
	useBasePhaseData,
	useConvertFunction,
	useExcludeData,
	useProdData,
	wellCountSeries,
	wellIds,
	xConvert,
}) => {
	if (noWells || !useProdData) {
		return [];
	}

	const basePhaseData = useBasePhaseData?.noalign;

	const { data: _plotData, idx, data_part_idx, days_in_month_arr: daysInMonthArr } = useProdData;
	let plotData = _plotData;
	if (displayMonthlyData && daysInMonthArr) {
		plotData = map(_plotData, (datum, wellIndex) => {
			return map(datum, (data, dataIndex) => {
				if (!data) return data;
				const multiplier = daysInMonthArr[wellIndex][dataIndex];
				return data * multiplier;
			});
		});
	}

	const {
		data: _excludedPlotData,
		idx: excludedIdx,
		data_part_idx: excludedDataPartIdx,
		days_in_month_arr: excludedDaysInMonthArr,
	} = useExcludeData ?? {};
	let excludedPlotData = _excludedPlotData;
	if (displayMonthlyData && daysInMonthArr) {
		excludedPlotData = map(_excludedPlotData, (datum, wellIndex) => {
			return map(datum, (data, dataIndex) => {
				if (!data) return data;
				const multiplier = excludedDaysInMonthArr[wellIndex][dataIndex];
				return data * multiplier;
			});
		});
	}

	let retSeries = [];

	if (showExcludedWells && useExcludeData) {
		excludedPlotData.forEach((datum, i) => {
			const [start, end, hasProduction] = excludedDataPartIdx[i];
			const wellId = excludedIds[i];
			if (!hasProduction) {
				retSeries.push({
					id: wellId,
					values: [],
				});
				return;
			}

			const prodIdx = excludedIdx.slice(start, end);
			const dataSeries = {
				...lineSeriesConfig({
					color: phaseColors.excluded,
					lineStyle: 'dashed',
					lineWidth: 1,
				}),
				id: wellId,
				values: datum
					.slice(start, end)
					.map((d, j) => [xConvert(prodIdx[j]), useConvertFunction ? convert(d) : d]),
				showInLegend: i === 0,
				text: 'Excluded',
			};
			const headers = headersMap.get(wellId);
			if (includeHeaders) {
				dataSeries.tooltip = tcTooltip();
				merge(dataSeries, getSingleHeaderInfo(headers));
			}

			retSeries.push(dataSeries);
		});
	}

	if (activeChartSeries.has('background') || showBackgroundOnly) {
		if (activeChartSeries.has('overlayForecast')) {
			plotData.forEach((datum, i) => {
				const wellId = wellIds[i];
				const colorByValue =
					getHeaderValue({ wellId, header: colorBy, convert: getInput, headersMap, eurMap }) ?? 'N/A';

				const dataSeries = {
					colorByValue,
					id: wellId,
					lineColor: showBackgroundOnly && zingPhaseColors?.[phase],
					showInLegend: false,
					values: datum.map((d, j) => [xConvert(idx[j]), useConvertFunction ? convert(d) : d]),
				};
				const headers = headersMap.get(wellId);
				if (includeHeaders) {
					dataSeries.tooltip = tcTooltip();
					merge(dataSeries, getSingleHeaderInfo(headers));
				}
				dataSeries.text = headers?.well_name; // need this for download purpose
				retSeries.push(dataSeries);
			});
		} else {
			plotData.forEach((datum, i) => {
				const [start, end, hasProduction] = data_part_idx[i];
				const wellId = wellIds[i];
				if (!hasProduction) {
					retSeries.push({
						id: wellId,
						values: [],
						colorByValue: 'N/A',
					});
					return;
				}
				const colorByValue =
					getHeaderValue({ wellId, header: colorBy, convert: getInput, headersMap, eurMap }) ?? 'N/A';

				const prodIdx = idx.slice(start, end);
				const dataSeries = {
					id: wellId,
					values: datum
						.slice(start, end)
						.map((d, j) => [xConvert(prodIdx[j]), useConvertFunction ? convert(d) : d]),
					showInLegend: false,
					colorByValue,
					lineColor: showBackgroundOnly && zingPhaseColors?.[phase],
				};
				const headers = headersMap.get(wellId);
				if (includeHeaders) {
					dataSeries.tooltip = tcTooltip();
					merge(dataSeries, getSingleHeaderInfo(headers));
				}
				dataSeries.text = headers?.well_name; // need this for download purpose
				retSeries.push(dataSeries);
			});
		}
	}

	if (!showBackgroundOnly) {
		let userLines = getUserLines(plotData, data_part_idx);
		if (basePhaseData && Object.keys(basePhaseData).length > 0) {
			const basePhaseLines = getUserLines(basePhaseData.data, basePhaseData.data_part_idx);
			userLines = mapValues(userLines, (val, key) =>
				basePhaseLines[key].map((phaseVal, idx) => phaseVal * val[idx])
			);
		}

		const { aveNoFst, average, count, p10, p50, p90, p50NoFst } = phaseColors;

		// add colMedian
		if (activeChartSeries.has('p50NoFst')) {
			retSeries.push({
				...lineSeriesConfig({ color: p50NoFst, forcedTooltip: true }),
				dataIgnoreSelection: true,
				tooltip: getTcTooltipStyles(p50NoFst),
				text: C4_DATA_SERIES_LABELS.colMedian,
				showInLegend: true,
				values: userLines.colMedian
					.map((u, i) => [xConvert(idx[i]), useConvertFunction ? convert(u) : u])
					.filter((value) => filterOnes(value[1])),
			});
		}

		// add colAverage
		if (activeChartSeries.has('aveNoFst')) {
			retSeries.push({
				...lineSeriesConfig({
					color: aveNoFst,
					forcedTooltip: true,
				}),
				dataIgnoreSelection: true,
				tooltip: getTcTooltipStyles(aveNoFst),
				text: C4_DATA_SERIES_LABELS.colAverage,
				showInLegend: true,
				values: userLines.colAverage
					.map((u, i) => [xConvert(idx[i]), useConvertFunction ? convert(u) : u])
					.filter((value) => filterOnes(value[1])),
			});
		}

		// add median
		if (activeChartSeries.has('p50')) {
			retSeries.push({
				...lineSeriesConfig({ color: p50, forcedTooltip: true }),
				dataIgnoreSelection: true,
				tooltip: getTcTooltipStyles(p50),
				text: C4_DATA_SERIES_LABELS.median,
				showInLegend: true,
				values: userLines.median
					.map((u, i) => [xConvert(idx[i]), useConvertFunction ? convert(u) : u])
					.filter((value) => filterOnes(value[1])),
			});
		}

		// add average
		if (activeChartSeries.has('average')) {
			retSeries.push({
				...lineSeriesConfig({ color: average, forcedTooltip: true }),
				dataIgnoreSelection: true,
				tooltip: getTcTooltipStyles(average),
				text: C4_DATA_SERIES_LABELS.average,
				showInLegend: true,
				values: userLines.average
					.map((u, i) => [xConvert(idx[i]), useConvertFunction ? convert(u) : u])
					.filter((value) => filterOnes(value[1])),
			});
		}

		// add well count
		if (activeChartSeries.has('count')) {
			retSeries.push({
				...lineSeriesConfig({ color: count, forcedTooltip: true }),
				dataIgnoreSelection: true,
				tooltip: getTcTooltipStyles(count),
				scaleY: {
					progression: 'linear',
				},
				text: C4_DATA_SERIES_LABELS.wellCount,
				showInLegend: true,
				values: wellCountSeries,
			});
		}

		// add Wells P10
		if (activeChartSeries.has('p10')) {
			retSeries.push({
				...lineSeriesConfig({ color: p10, forcedTooltip: true }),
				dataIgnoreSelection: true,
				tooltip: getTcTooltipStyles(p10),
				text: C4_DATA_SERIES_LABELS.wellsP10,
				showInLegend: true,
				values: userLines.wellsP10
					.map((u, i) => [xConvert(idx[i]), useConvertFunction ? convert(u) : u])
					.filter((value) => filterOnes(value[1])),
			});
		}

		// add Wells P90
		if (activeChartSeries.has('p90')) {
			retSeries.push({
				...lineSeriesConfig({ color: p90, forcedTooltip: true }),
				dataIgnoreSelection: true,
				tooltip: getTcTooltipStyles(p90),
				text: C4_DATA_SERIES_LABELS.wellsP90,
				showInLegend: true,
				values: userLines.wellsP90
					.map((u, i) => [xConvert(idx[i]), useConvertFunction ? convert(u) : u])
					.filter((value) => filterOnes(value[1])),
			});
		}
	}
	return retSeries;
};

export const generateC4FitSeries = (
	activeChartSeries,
	c4RatioShowRate,
	convert,
	alignAdjustedFitSeries,
	getShiftBaseSegments,
	phaseColors,
	phaseType,
	xConvert,
	seriesConfig = {}
) => {
	return Object.keys(FIT_OBJECT)
		.map((pKey) => {
			const { segments } = alignAdjustedFitSeries?.[pKey] ?? {};
			if (!activeChartSeries.has(pKey) || !segments?.length) {
				return false;
			}

			const lineConfig = lineSeriesConfig({
				color: phaseColors[`${pKey}Fit`],
				forcedTooltip: true,
				lineStyle: seriesConfig?.fit?.lineStyle ?? P_SERIES_LINE_STYLES[pKey],
				lineWidth: '4px',
			});

			let values;
			if (phaseType === 'ratio' && c4RatioShowRate) {
				const idxArr = RAW_CUM_IDX_ARRAY.map((t) => t + segments[0].start_idx);
				const baseSegments = getShiftBaseSegments(segments);
				values = multiSeg
					.predictTimeRatio({ idxArr, ratioTSegments: segments, baseSegments })
					.map((v, i) => [idxArr[i], v]);
			} else {
				values = genSeriesData({
					beginIdx: null,
					CHART_RESOLUTION,
					finalIdx: segments[segments.length - 1].end_idx,
					index: true,
					segments,
				});
			}

			return {
				...lineConfig,
				dataIgnoreSelection: true,
				tooltip: getTcTooltipStyles(phaseColors[`${pKey}Fit`]),
				showInLegend: true,
				text: `${capitalize(pKey)} Fit`,
				values: values
					.map((value) => [xConvert(value[0]), convert(value[1])])
					.filter((value) => filterOnes(value[1])),
			};
		})
		.filter(Boolean);
};

export const generateWellCountSeries = (useProdData, xConvert) => {
	if (!useProdData) {
		return [];
	}

	const { data_part_idx, idx } = useProdData;
	const length = idx.length;
	const countArr = Array(length).fill(0);

	data_part_idx.forEach(([start, end, hasProduction]) => {
		if (hasProduction) {
			for (let i = start; i < end; i++) {
				countArr[i]++;
			}
		}
	});

	return countArr.map((u, i) => [xConvert(idx[i]), u]);
};

const C4Chart = (props) => {
	const {
		activeChartSeries,
		align,
		alignAdjustedFitSeries,
		basePhase,
		basePhaseBackgroundData,
		c4RatioShowRate,
		calculatedExcludedData,
		chartBehaviors = {},
		chartSettings,
		colorBy,
		curPhase,
		eurMap,
		excludedIds,
		excludedPhaseData,
		getShiftBaseSegments,
		headersMap,
		noWells,
		phaseType,
		prodData,
		proximityProps = {},
		selection,
		setXAxisLabel,
		setYAxisLabel,
		showBackgroundOnly,
		showExcludedWells,
		showDaily,
		showDailyRate,
		wellIds,

		// currently disabled for proximity; can remove this dependency once appropriate data is incorporated
		includeHeaders = true,
	} = props;

	// convert y values using daysInMonth when phaseType is rate or displaying ratio as rate
	const displayMonthlyData = phaseType !== 'ratio' || c4RatioShowRate ? !showDailyRate : false;
	// use conversion function for ratio phase only.
	// Ratio for gas to liquid is in CF/BBL by default, not MCF/BBL. This is the only case I see that uses conversion function.
	const useConvertFunctionForWellSeries = phaseType === 'ratio' && !c4RatioShowRate;

	const {
		palette: { charts, type: theme },
	} = useTheme();

	const phaseColors = cloneDeep(CHART_COLORS[curPhase]);
	phaseColors.excluded = charts.excluded;

	const unitKey =
		phaseType === 'rate' || (phaseType === 'ratio' && c4RatioShowRate) ? curPhase : `${curPhase}/${basePhase}`;

	const { prodData: excludedProdData } = excludedPhaseData ?? {};

	const useProdData = prodData;

	const useBasePhaseData = phaseType === 'ratio' && c4RatioShowRate ? basePhaseBackgroundData : EMPTY_BASE_PHASE_DATA;

	const useExcludeData =
		phaseType === 'ratio' && c4RatioShowRate ? calculatedExcludedData?.target_phase?.c4use : excludedProdData;

	const convertYValue = useMemo(() => {
		const targetUnit = displayMonthlyData ? monthlyUnitTemplate[unitKey] : defaultUnitTemplate[unitKey];
		return getConvertFunc(dailyUnitTemplate[unitKey], targetUnit);
	}, [displayMonthlyData, unitKey]);

	const xConvert = useCallback((value) => (showDaily ? value : convertDailyToMonthly(value)), [showDaily]);

	const wellCountSeries = useMemo(() => {
		return generateWellCountSeries(useProdData, xConvert);
	}, [useProdData, xConvert]);

	const wellSeries = useMemo(() => {
		return generateC4WellSeries({
			activeChartSeries,
			colorBy,
			convert: convertYValue,
			displayMonthlyData,
			eurMap,
			excludedIds,
			headersMap,
			includeHeaders,
			noWells,
			phase: curPhase,
			phaseColors,
			showBackgroundOnly,
			showExcludedWells,
			useBasePhaseData,
			useConvertFunction: useConvertFunctionForWellSeries,
			useExcludeData,
			useProdData,
			wellCountSeries,
			wellIds,
			xConvert,
		});
	}, [
		activeChartSeries,
		convertYValue,
		curPhase,
		colorBy,
		displayMonthlyData,
		eurMap,
		excludedIds,
		headersMap,
		includeHeaders,
		noWells,
		phaseColors,
		showBackgroundOnly,
		showExcludedWells,
		useBasePhaseData,
		useConvertFunctionForWellSeries,
		useExcludeData,
		useProdData,
		wellCountSeries,
		wellIds,
		xConvert,
	]);

	const fitSeries = useMemo(() => {
		return generateC4FitSeries(
			activeChartSeries,
			c4RatioShowRate,
			convertYValue,
			alignAdjustedFitSeries,
			getShiftBaseSegments,
			phaseColors,
			phaseType,
			xConvert
		);
	}, [
		activeChartSeries,
		c4RatioShowRate,
		convertYValue,
		alignAdjustedFitSeries,
		getShiftBaseSegments,
		phaseColors,
		phaseType,
		xConvert,
	]);

	const bgSeries = useMemo(() => {
		if (!proximityProps?.targetBGData) {
			return [];
		}
		const { index, value } = proximityProps.targetBGData;

		const wellId = proximityProps.wellId;
		const dataSeries = {
			...lineSeriesConfig({ color: PROXIMITY_TARGET_WELL_COLOR, forcedTooltip: true }),
			text: 'Target Well Data',
			showInLegend: true,
			id: wellId,
			values: value?.map((d, i) => [xConvert(index[i] - index[0]), convertYValue(d)]) ?? [],
		};
		return [dataSeries];
	}, [convertYValue, proximityProps, xConvert]);

	const series = useMemo(
		() => (showBackgroundOnly ? wellSeries : [...wellSeries, ...fitSeries, ...bgSeries]),
		[showBackgroundOnly, wellSeries, fitSeries, bgSeries]
	);

	// Render the chart
	const {
		enableLegend,
		fontSizeScale,
		yearsBefore,
		yearsPast,
		yLogScale,
		yMax: settingsYMax,
		yMin: settingsYMin,
	} = chartSettings;

	const { xMin, xMax, yMin, yMax } = useTcChartMinMax({
		xType: 'relativeTime',
		yearsBefore,
		yearsPast,
		yMax: settingsYMax,
		yMin: settingsYMin,
	});

	// set yAxisLabel
	useEffect(() => {
		const label = displayMonthlyData ? monthlyUnitTemplate[unitKey] : defaultUnitTemplate[unitKey];
		setYAxisLabel(label);
	}, [unitKey, setYAxisLabel, displayMonthlyData]);

	// set xAxisLabel
	useEffect(() => setXAxisLabel(showDaily ? 'Days' : 'Months'), [showDaily, setXAxisLabel]);

	const zcProps = useMemo(() => {
		if ((showBackgroundOnly || activeChartSeries.has('background')) && !noWells) {
			const selectionPlotsIds = [...(showExcludedWells ? excludedIds : []), ...wellIds];
			return { modules: 'fastline,selection-tool', selection, selectionPlotsIds };
		} else {
			return { modules: 'fastline' };
		}
	}, [showBackgroundOnly, activeChartSeries, noWells, showExcludedWells, excludedIds, wellIds, selection]);

	return (
		<TcZingChart
			{...chartBehaviors}
			{...zcProps}
			data={{
				crosshairX: Zingchart.CROSSHAIR.SCALE,
				crosshairY: Zingchart.CROSSHAIR.SCALE,
				legend: { visible: enableLegend },
				series,
				type: 'fastline',

				// determines background wells color
				plot: {
					hoverState: {
						lineColor: charts.hovered,
					},
					lineColor: BACKGROUND_WELL_COLORS[theme],
					lineWidth: '1px',
					selectedState: { lineColor: charts.selected },
				},
				scaleX: {
					...genTCScaleX({ time: false, minValue: xConvert(xMin), maxValue: xConvert(xMax), fontSizeScale }),

					// add dotted line at 0 when align === 'align'
					'custom-items': [[0, '0']],
					markers:
						align === 'align'
							? [
									{
										alpha: 1,
										lineColor: TEAL_1,
										lineStyle: 'dashed',
										lineWidth: '3px',
										placement: 'top',
										range: [0],
										type: 'line',
										valueRange: true,
									},
							  ]
							: undefined,
				},
				scaleY: genScaleY({ log: yLogScale, minValue: yMin, maxValue: yMax, fontSizeScale }),
				plotarea: { marginRight: '35rem' },
			}}
			colorBySeriesType='single-well'
			useColorBy={Boolean(colorBy)}
			useExcludedWells
		/>
	);
};

export default C4Chart;
