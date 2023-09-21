import { MultipleSegments } from '@combocurve/forecast/models';
import { useTheme } from '@material-ui/core';
import { useEffect, useMemo } from 'react';

import Zingchart from '@/components/Zingchart';
import { useMergedState } from '@/components/hooks';
import { ChartSettings } from '@/forecasts/charts/useChartSettings';
import { useUnitTemplates } from '@/forecasts/shared';
import { useTcConvertFunc } from '@/forecasts/shared/getUnitTemplates';
import { capitalize } from '@/helpers/text';
import { ZingchartSerie, genScaleY, lineSeriesConfig, phaseColors as zingPhaseColors } from '@/helpers/zing';
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
} from '@/type-curves/charts/shared';
import { genTCScaleX } from '@/type-curves/shared/tcChartConfig';

import { RAW_CUM_IDX_ARRAY, getDiscreteCumulative } from './FitCumChart-v2';

const multiSeg = new MultipleSegments();

const FIT_CUM_CHART_SERIES_PAIR = [
	{ userLineKey: 'median', userLineName: 'Wells P50', fitKey: 'P50', fitName: 'P50 Fit' },
	{ userLineKey: 'average', userLineName: 'Wells Average', fitKey: 'best', fitName: 'Best Fit' },
	{ userLineKey: 'colAverage', userLineName: 'Wells Average No Forecast', fitKey: 'best', fitName: 'Best Fit' },
];

const checkNumber = (v: number | string | undefined) => (Number.isFinite(v) ? Number(v) : undefined);

const useRateVsCumChartState = () => {
	const [rateVsCumState, setRateVsCumState] = useMergedState({
		aggregationHonorFit: false,
		bgWellsHonorFit: false,
		showBackgroundOnly: true,
		showDaily: false,
		showExcludedWells: false,
	});

	return { rateVsCumState, setRateVsCumState };
};

const RateVsCumChart = ({
	activeChartSeries,
	aggregationHonorFit,
	alignAdjustedFitSeries = {},
	bgWellsHonorFit,
	calculatedBackgroundData,
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
}: {
	activeChartSeries: Set<string>;
	aggregationHonorFit: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	alignAdjustedFitSeries: { [key: string]: { segments: any } };
	bgWellsHonorFit: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	calculatedBackgroundData: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	calculatedExcludedData: any;
	chartBehaviors?: { disablePDF?: boolean; disableXLSX?: boolean };
	chartSettings: ChartSettings;
	colorBy: string | null;
	curPhase: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	eurMap: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	excludedPhaseData: any;
	excludedIds: string[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getShiftBaseSegments: (v) => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	headersMap: Map<string, any>;
	noWells: boolean;
	phaseType: 'rate' | 'ratio';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	prodData: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	selection: any;
	setXAxisLabel: (v) => void;
	setYAxisLabel: (v) => void;
	showBackgroundOnly?: boolean;
	showExcludedWells: boolean;
	showDaily: boolean;
	wellIds: string[];
}) => {
	const {
		palette: { charts, type: theme },
	} = useTheme();

	const { defaultUnitTemplate } = useUnitTemplates();

	const xUnitKey = useMemo(() => `cumsum_${curPhase}`, [curPhase]);
	const { convert: xConvert } = useTcConvertFunc(xUnitKey);

	const { convert: yConvert } = useTcConvertFunc(curPhase);
	const { prodData: excludedProdData } = excludedPhaseData ?? {};

	const useProdData = phaseType === 'ratio' ? calculatedBackgroundData?.target_phase?.c4use : prodData;
	const useExcludeData = phaseType === 'ratio' ? calculatedExcludedData?.target_phase?.c4use : excludedProdData;
	// always use monthly resolution for this chart
	const phaseColors = CHART_COLORS[curPhase];

	const userLines = useMemo(
		() => (useProdData ? getUserLines(useProdData.data, useProdData.data_part_idx) : {}),
		[useProdData]
	);

	const [fitChartSeries, minFitValue] = useMemo(() => {
		if (showBackgroundOnly) {
			return [[], undefined];
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const ret: any[] = []; // TODO add interface later

		if (alignAdjustedFitSeries) {
			// alignAdjustedFitSeries is always fixed
			Object.entries(alignAdjustedFitSeries).forEach(([pKey, { segments }]) => {
				if (activeChartSeries.has(pKey) && segments && segments.length) {
					const offsetIdxArr = RAW_CUM_IDX_ARRAY.map((v) => v + segments[0].start_idx);
					const cum =
						phaseType === 'ratio'
							? multiSeg.cumFromTRatio({
									idxArr: offsetIdxArr,
									production: null,
									phase: curPhase,
									ratioSeries: segments,
									baseSeries: getShiftBaseSegments(segments),
									dataFreq: 'daily',
							  })
							: multiSeg.cumFromT({
									idxArr: offsetIdxArr,
									production: null,
									phase: curPhase,
									series: segments,
									dataFreq: 'daily',
							  });
					const rate =
						phaseType === 'ratio'
							? multiSeg.predictTimeRatio({
									idxArr: offsetIdxArr,
									ratioTSegments: segments,
									baseSegments: getShiftBaseSegments(segments),
							  })
							: multiSeg.predict({
									idxArr: offsetIdxArr,
									segments,
							  });
					const color = phaseColors[`${pKey}Fit`];
					ret.push({
						...lineSeriesConfig({ color, lineWidth: '4px', lineStyle: P_SERIES_LINE_STYLES[pKey] }),
						dataIgnoreSelection: true,
						tooltip: getTcTooltipStyles(color),
						text: `${capitalize(pKey)} Fit`,
						showInLegend: true,
						values: cum.map((v, i) => [Math.round(xConvert(v)), yConvert(rate[i])]),
					});
				}
			});
		}

		const seriesMinValues = ret.map((series) =>
			Math.min(...series.values.map(([_x, y]) => y).filter((val) => val !== null && val !== undefined))
		);
		let minValue = Math.min(...seriesMinValues);
		// If no arguments are given, Math.min() returns Infinity
		minValue = minValue && isFinite(minValue) ? minValue : 0.01;

		return [ret, minValue / 10];
	}, [
		activeChartSeries,
		alignAdjustedFitSeries,
		curPhase,
		getShiftBaseSegments,
		phaseColors,
		phaseType,
		showBackgroundOnly,
		xConvert,
		yConvert,
	]);

	const wellSeries: ZingchartSerie[] = useMemo(() => {
		if (noWells || !useProdData || !useExcludeData || !eurMap) {
			return [];
		}

		const retSeries: (ZingchartSerie & { colorByValue?: string })[] = [];
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
					rateVsCum: true,
				}).map(([t, v]) => [xConvert(t), yConvert(v)]);

				retSeries.push({
					...lineSeriesConfig({
						color: charts.excluded,
						lineStyle: 'dashed',
						lineWidth: '1px',
					}),
					values,
					tooltip: tcTooltip(),
					...getSingleHeaderInfo(headersMap.get(excludedIds[i])),
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					showInLegend: i === 0,
					text: 'Excluded',
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
					rateVsCum: true,
				}).map(([x, y]) => [Math.round(xConvert(x)), yConvert(y)]);
				const colorByValue =
					getHeaderValue({ wellId: wellIds[i], header: colorBy, convert: getInput, headersMap, eurMap }) ??
					'N/A';

				retSeries.push({
					values,
					tooltip: tcTooltip(),
					lineColor: showBackgroundOnly && !colorBy && zingPhaseColors?.[curPhase],
					...getSingleHeaderInfo(headersMap.get(wellIds[i])),
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
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
						rateVsCum: true,
						overlayForecast: true,
					}).map(([x, y]) => [Math.round(xConvert(x)), yConvert(y)]);
					retSeries.push({
						dataIgnoreSelection: true,
						values,
						...lineSeriesConfig({
							color: { average: phaseColors.average, median: phaseColors.p50 }[userLineKey],
							lineWidth: '4px',
						}),
						tooltip: getTcTooltipStyles(phaseColors.average),
						text: userLineName,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
						// @ts-expect-error
						showInLegend: true,
					});
				}
			});
		}

		return retSeries;
	}, [
		noWells,
		useProdData,
		useExcludeData,
		eurMap,
		activeChartSeries,
		showExcludedWells,
		showBackgroundOnly,
		alignAdjustedFitSeries?.best?.segments,
		bgWellsHonorFit,
		charts.excluded,
		headersMap,
		excludedIds,
		xConvert,
		yConvert,
		colorBy,
		wellIds,
		curPhase,
		userLines,
		aggregationHonorFit,
		phaseColors.average,
		phaseColors.p50,
	]);

	const {
		enableLegend,
		fontSizeScale,
		yLogScale,
		yMax: settingsYMax,
		yMin: settingsYMin,
		cumMax,
		cumMin,
	} = chartSettings;

	const series = useMemo(() => [...wellSeries, ...fitChartSeries], [fitChartSeries, wellSeries]);

	const { xMin, xMax, yMin, yMax } = useMemo(
		() => ({
			xMin: checkNumber(cumMin),
			xMax: checkNumber(cumMax),
			yMin: checkNumber(settingsYMin),
			yMax: checkNumber(settingsYMax),
		}),
		[cumMax, cumMin, settingsYMax, settingsYMin]
	);

	useEffect(() => {
		setYAxisLabel(defaultUnitTemplate[curPhase]);
		setXAxisLabel(defaultUnitTemplate[xUnitKey]);
	}, [curPhase, defaultUnitTemplate, setXAxisLabel, setYAxisLabel, showDaily, xUnitKey]);

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
				scaleX: genTCScaleX({ time: false, minValue: xMin, maxValue: xMax, fontSizeScale }),
				scaleY: genScaleY({ log: yLogScale, minValue: yMin ?? minFitValue, maxValue: yMax, fontSizeScale }),
			}}
			colorBySeriesType='single-well'
			useColorBy={Boolean(colorBy)}
			useExcludedWells
		/>
	);
};

export default RateVsCumChart;
export { useRateVsCumChartState };
