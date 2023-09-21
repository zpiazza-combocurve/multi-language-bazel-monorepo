import { DAYS_IN_YEAR } from '@combocurve/forecast/helpers';
import { MultipleSegments } from '@combocurve/forecast/models';
import { useTheme } from '@material-ui/core';
import _ from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';

import Zingchart from '@/components/Zingchart';
import { useMergedState } from '@/components/hooks';
import { useUnitTemplates } from '@/forecasts/shared';
import { useTcConvertFunc } from '@/forecasts/shared/getUnitTemplates';
import { cumFromDiscreteData } from '@/helpers/math';
import { capitalize } from '@/helpers/text';
import { genScaleY, lineSeriesConfig, phaseColors as zingPhaseColors } from '@/helpers/zing';
import { getConvertFunc } from '@/inpt-shared/helpers/units';
import { getHeaderValue, getInput } from '@/type-curves/charts/HeaderChart';
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
import { genTCScaleX } from '@/type-curves/shared/tcChartConfig';

const multiSeg = new MultipleSegments();

export const RAW_CUM_IDX_ARRAY = [
	..._.range(100),
	..._.range(100, 300, 2),
	..._.range(300, Math.floor(DAYS_IN_YEAR * 60), 30),
	Math.floor(DAYS_IN_YEAR * 60),
];

export const getDiscreteCumulative = ({
	rawTimeArr,
	rawValueArr,
	fitStart,
	honorFit,
	dataPartIdx,
	overlayForecast = true,
	rateVsCum = false,
}) => {
	const [startIndex, endIndex, hasData] = dataPartIdx;
	if (!hasData && !overlayForecast) {
		return [];
	}
	const selfStart = rawTimeArr[startIndex];
	const timeArr = rawTimeArr.slice(startIndex);
	const valueArr = rawValueArr.slice(startIndex);
	let cumStartTime;
	let cumTimeArr;

	if (honorFit && Number.isFinite(fitStart)) {
		if (fitStart >= selfStart) {
			cumStartTime = fitStart;
			cumTimeArr = RAW_CUM_IDX_ARRAY.map((t) => t + fitStart);
		} else {
			cumStartTime = selfStart;
			cumTimeArr = [fitStart, selfStart - 1, ...RAW_CUM_IDX_ARRAY.map((t) => t + selfStart)];
		}
	} else {
		cumStartTime = selfStart;
		cumTimeArr = RAW_CUM_IDX_ARRAY.map((t) => t + selfStart);
	}

	if (!overlayForecast) {
		const selfEnd = rawTimeArr[endIndex];
		cumTimeArr = cumTimeArr.filter((t) => t < selfEnd);
	}

	return rateVsCum // do not check rateVsCum in map to reduce number of boolean checks
		? cumFromDiscreteData({ timeArr, valueArr, cumStartTime, cumTimeArr }).map(({ rate, cum }) => [cum, rate])
		: cumFromDiscreteData({ timeArr, valueArr, cumStartTime, cumTimeArr }).map(({ cum }, i) => [
				cumTimeArr[i] - cumTimeArr[0],
				cum,
		  ]);
};

const convertDailyToMonthly = getConvertFunc('D', 'M');

const FIT_CUM_CHART_SERIES_PAIR = [
	{ userLineKey: 'median', userLineName: 'Wells P50', fitKey: 'P50', fitName: 'P50 Fit' },
	{ userLineKey: 'average', userLineName: 'Wells Average', fitKey: 'best', fitName: 'Best Fit' },
	{ userLineKey: 'colAverage', userLineName: 'Wells Average No Forecast', fitKey: 'best', fitName: 'Best Fit' },
];

const useFitCumChartState = () => {
	const [fitCumState, setFitCumState] = useMergedState({
		aggregationHonorFit: false,
		bgWellsHonorFit: false,
		showBackgroundOnly: true,
		showDaily: false,
		showExcludedWells: false,
	});

	return {
		fitCumState,
		setFitCumState,
	};
};

const FitCumChart = ({
	activeChartSeries,
	aggregationHonorFit,
	alignAdjustedFitSeries = {},
	basePhaseBackgroundData,
	bgWellsHonorFit,
	calculatedExcludedData,
	chartBehaviors = {},
	chartSettings,
	colorBy,
	curPhase,
	eurMap,
	excludedPhaseData,
	excludedIds,
	getShiftBaseSegments,
	headersMap,
	noWells,
	phaseType,
	prodData,
	selection,
	setXAxisLabel,
	setYAxisLabel,
	showBackgroundOnly,
	showExcludedWells,
	showDaily,
	wellIds,
}) => {
	const {
		palette: { charts, type: theme },
	} = useTheme();

	const { defaultUnitTemplate } = useUnitTemplates();

	const templateKey = useMemo(() => `cumsum_${curPhase}`, [curPhase]);
	const { convert: yConvert } = useTcConvertFunc(templateKey);

	const { prodData: excludedProdData } = excludedPhaseData ?? {};

	const useBasePhaseData = phaseType === 'ratio' ? basePhaseBackgroundData : {};
	const useProdData = prodData;
	const useExcludeData = phaseType === 'ratio' ? calculatedExcludedData?.target_phase?.c4use : excludedProdData;
	// always use monthly resolution for this chart
	const xConvert = useCallback((value) => (showDaily ? value : convertDailyToMonthly(value)), [showDaily]);
	const phaseColors = CHART_COLORS[curPhase];

	const userLines = useMemo(() => {
		if (!useProdData) return {};
		const _userLines = getUserLines(useProdData.data, useProdData.data_part_idx);
		const basePhaseData = useBasePhaseData?.noalign;
		if (basePhaseData && Object.keys(basePhaseData).length > 0) {
			const basePhaseLines = getUserLines(basePhaseData.data, basePhaseData.data_part_idx);
			return _.mapValues(_userLines, (val, key) =>
				basePhaseLines[key].map((phaseVal, idx) => phaseVal * val[idx])
			);
		}
		return _userLines;
	}, [useBasePhaseData?.noalign, useProdData]);

	const fitChartSeries = useMemo(() => {
		const ret = [];
		if (alignAdjustedFitSeries && !showBackgroundOnly) {
			// alignAdjustedFitSeries is always fixed
			_.entries(alignAdjustedFitSeries).forEach(([pKey, { segments }]) => {
				if (activeChartSeries.has(pKey) && segments && segments.length) {
					const offsetIdxArr = RAW_CUM_IDX_ARRAY.map((v) => v + segments[0].start_idx);
					const cum =
						phaseType === 'ratio'
							? multiSeg.cumFromTRatio({
									idxArr: offsetIdxArr,
									production: null,
									ratioSeries: segments,
									baseSeries: getShiftBaseSegments(segments),
									dataFreq: 'daily',
							  })
							: multiSeg.cumFromT({
									idxArr: offsetIdxArr,
									production: null,
									series: segments,
									dataFreq: 'daily',
							  });
					const color = phaseColors[`${pKey}Fit`];
					ret.push({
						...lineSeriesConfig({ color, lineWidth: '4px', lineStyle: P_SERIES_LINE_STYLES[pKey] }),
						dataIgnoreSelection: true,
						tooltip: getTcTooltipStyles(color),
						text: `${capitalize(pKey)} Fit`,
						showInLegend: true,
						values: cum.map((v, i) => [xConvert(RAW_CUM_IDX_ARRAY[i]), yConvert(v)]),
					});
				}
			});
		}
		return ret;
	}, [
		activeChartSeries,
		alignAdjustedFitSeries,
		getShiftBaseSegments,
		phaseColors,
		phaseType,
		showBackgroundOnly,
		xConvert,
		yConvert,
	]);

	const wellSeries = useMemo(() => {
		if (noWells || !useProdData || !useExcludeData || !eurMap) {
			return [];
		}

		let retSeries = [];
		const overlayForecast = activeChartSeries.has('overlayForecast');
		if (showExcludedWells) {
			useExcludeData.data.forEach((row, i) => {
				const values = getDiscreteCumulative({
					rawTimeArr: useExcludeData.idx,
					rawValueArr: row,
					fitStart: alignAdjustedFitSeries?.best?.segments?.[0]?.start_idx,
					honorFit: bgWellsHonorFit,
					dataPartIdx: useExcludeData.data_part_idx[i],
					overlayForecast,
				}).map(([t, v]) => [xConvert(t), yConvert(v)]);

				retSeries.push({
					...lineSeriesConfig({
						color: charts.excluded,
						lineStyle: 'dashed',
						lineWidth: 1,
					}),
					values,
					tooltip: tcTooltip(),
					showInLegend: i === 0,
					text: 'Excluded',
					...getSingleHeaderInfo(headersMap.get(excludedIds[i])),
				});
			});
		}

		if (activeChartSeries.has('background') || showBackgroundOnly) {
			useProdData.data.forEach((row, i) => {
				const values = getDiscreteCumulative({
					rawTimeArr: useProdData.idx,
					rawValueArr: row,
					fitStart: alignAdjustedFitSeries?.best?.segments?.[0]?.start_idx,
					honorFit: bgWellsHonorFit,
					dataPartIdx: useProdData.data_part_idx[i],
					overlayForecast,
				}).map(([t, v]) => [xConvert(t), yConvert(v)]);
				let colorByValue =
					getHeaderValue({ wellId: wellIds[i], header: colorBy, convert: getInput, headersMap, eurMap }) ??
					'N/A';

				retSeries.push({
					values,
					tooltip: tcTooltip(),
					lineColor: showBackgroundOnly && zingPhaseColors?.[curPhase],
					...getSingleHeaderInfo(headersMap.get(wellIds[i])),
					showInLegend: false,
					colorByValue,
				});
			});
		}

		if (!showBackgroundOnly) {
			FIT_CUM_CHART_SERIES_PAIR.forEach(({ userLineKey, userLineName }) => {
				if (activeChartSeries.has(userLineKey)) {
					const values = getDiscreteCumulative({
						rawTimeArr: useProdData.idx,
						rawValueArr: userLines[userLineKey],
						fitStart: alignAdjustedFitSeries?.best?.segments?.[0]?.start_idx,
						honorFit: aggregationHonorFit,
						dataPartIdx: [0, useProdData.idx.length, true], // hardcode for average series, but it can be calculated using all wells data_part_idx
						overlayForecast: true,
					}).map(([t, v]) => [xConvert(t), yConvert(v)]);

					retSeries.push({
						dataIgnoreSelection: true,
						values,
						...lineSeriesConfig({
							color: { average: phaseColors.average, median: phaseColors.p50 }[userLineKey],
							lineWidth: '4px',
						}),
						tooltip: getTcTooltipStyles(phaseColors.average),
						text: userLineName,
						showInLegend: true,
					});
				}
			});
		}

		return retSeries;
	}, [
		activeChartSeries,
		aggregationHonorFit,
		alignAdjustedFitSeries?.best?.segments,
		bgWellsHonorFit,
		charts.excluded,
		colorBy,
		curPhase,
		eurMap,
		excludedIds,
		headersMap,
		noWells,
		phaseColors.average,
		phaseColors.p50,
		showBackgroundOnly,
		showExcludedWells,
		useExcludeData,
		useProdData,
		userLines,
		wellIds,
		xConvert,
		yConvert,
	]);

	const {
		enableLegend,
		fontSizeScale,
		yearsBefore,
		yearsPast,
		yLogScale,
		yMax: settingsYMax,
		yMin: settingsYMin,
	} = chartSettings;

	const series = useMemo(() => [...wellSeries, ...fitChartSeries], [fitChartSeries, wellSeries]);
	const { xMin, xMax, yMin, yMax } = useTcChartMinMax({
		yearsBefore,
		yearsPast,
		yMin: settingsYMin,
		yMax: settingsYMax,
		xType: 'relativeTime',
	});

	useEffect(() => {
		setYAxisLabel(defaultUnitTemplate[templateKey]);
		setXAxisLabel(showDaily ? 'Days' : 'Months');
	}, [defaultUnitTemplate, setXAxisLabel, setYAxisLabel, showDaily, templateKey]);

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
			disableXLSX
			data={{
				crosshairX: Zingchart.CROSSHAIR.SCALE,
				crosshairY: Zingchart.CROSSHAIR.SCALE,
				legend: { visible: enableLegend },
				series,
				type: 'fastline',
				plot: {
					hoverState: {
						lineColor: charts.hovered,
					},
					lineColor: BACKGROUND_WELL_COLORS[theme],
					lineWidth: '1px',
					selectedState: { lineColor: charts.selected },
				},
				scaleX: genTCScaleX({ time: false, minValue: xConvert(xMin), maxValue: xConvert(xMax), fontSizeScale }),
				scaleY: genScaleY({ log: yLogScale, minValue: yMin, maxValue: yMax, fontSizeScale }),
			}}
			colorBySeriesType='single-well'
			useColorBy={Boolean(colorBy)}
			useExcludedWells
		/>
	);
};

export default FitCumChart;
export { useFitCumChartState };
