import { MultipleSegments } from '@combocurve/forecast/models';
import { useTheme } from '@material-ui/core';
import { useEffect, useMemo } from 'react';

import Zingchart from '@/components/Zingchart';
import { useUnitTemplates } from '@/forecasts/shared';
import { useTcConvertFunc } from '@/forecasts/shared/getUnitTemplates';
import { calculatePercentile } from '@/helpers/math';
import { capitalize } from '@/helpers/text';
import { clone } from '@/helpers/utilities';
import { genScaleY, lineSeriesConfig, scatterSeriesConfig } from '@/helpers/zing';
import { getHeaderValue, getInput } from '@/type-curves/charts/HeaderChart';
import { NUMERICAL_P_VALUES, getAveragePercentile } from '@/type-curves/charts/graphProperties';
import {
	CHART_COLORS,
	TcZingChart,
	getChartHeaderInfo,
	getTcTooltipStyles,
	tcTooltip,
	useTcChartMinMax,
} from '@/type-curves/charts/shared';
import { generatePercentileArr } from '@/type-curves/shared/eurMath';
import { genTCScaleX } from '@/type-curves/shared/tcChartConfig';

const multiSeg = new MultipleSegments();

const getRateFitPeak = (fitSeries) => {
	return fitSeries
		? Object.entries(fitSeries).reduce((obj, [pSeries, pValue]) => {
				const { segments } = pValue;
				if (!segments?.length) {
					return obj;
				}

				const maxValue = segments.reduce((curMax, segment) => {
					const { q_start, q_end } = segment;
					const qMax = Math.max(q_start, q_end);
					return Math.max(qMax, curMax);
				}, -Infinity);

				return { ...obj, [pSeries]: maxValue };
		  }, {})
		: {};
};

const getRatioFitPeak = (ratioPhaseFit, baseSegments) => {
	return ratioPhaseFit
		? Object.entries(ratioPhaseFit).reduce((obj, [pSeries, ratioValue]) => {
				const { segments: ratioSegments } = ratioValue;

				const deltaT = ratioSegments[0].start_idx - baseSegments[0].start_idx;
				const shiftedSegments = multiSeg.shiftSegmentsIdx({ inputSegments: baseSegments, deltaT });
				const timeArr = [...shiftedSegments, ...ratioSegments]
					.map((segment) => [segment.start_idx, segment.end_idx])
					.flat()
					.sort((a, b) => a - b);

				const predicted = multiSeg.predictTimeRatio({
					idxArr: timeArr,
					ratioTSegments: ratioSegments,
					baseSegments: shiftedSegments,
					toFill: 0,
				});
				return { ...obj, [pSeries]: Math.max(...predicted) };
		  }, {})
		: {};
};

const InitialPeakChart = (props) => {
	const {
		activeChartSeries,
		align: parentAlign,
		basePhaseFit,
		basePhaseSeries,
		chartBehaviors = {},
		chartSettings,
		colorBy,
		curPhase,
		eurMap,
		fitLoaded,
		fitSeries,
		noWells,
		phaseType,
		prodData,
		setYAxisLabel,
		selection,
		wellIds,
		headersMap,
		noalignMonthlyTargetProdData,
	} = props;
	const {
		palette: { charts },
	} = useTheme();

	const unitTemplates = useUnitTemplates();
	const { defaultUnitTemplate, loaded: templatesLoaded } = unitTemplates;
	const { convert, loaded: conversionLoaded } = useTcConvertFunc(curPhase);

	const prodC4 = useMemo(() => {
		if (noWells) {
			return null;
		}
		if (noalignMonthlyTargetProdData && prodData) {
			let output = null;
			if (phaseType === 'rate') {
				const { data, idx, data_part_idx } = prodData;
				if (parentAlign === 'align') {
					const maxIdx = idx.findIndex((value) => value === 0);
					output = data.map((datum) => datum[maxIdx]);
				}
				if (parentAlign === 'noalign') {
					output = data.map((datum, datumIdx) => {
						const [dataStart, dataEnd, hasData] = data_part_idx[datumIdx];
						const toObserve = hasData ? datum.slice(dataStart, dataEnd) : datum;
						return Math.max(...toObserve);
					});
				}
			}
			if (phaseType === 'ratio') {
				const { data, data_part_idx } = noalignMonthlyTargetProdData;
				output = data.map((datum, datumIdx) => {
					const [dataStart, dataEnd, hasData] = data_part_idx[datumIdx];
					const toObserve = hasData ? datum.slice(dataStart, dataEnd) : datum;
					return Math.max(...toObserve);
				});
			}
			return { ip: output, percentile: generatePercentileArr(clone(output)) };
		}
		return null;
	}, [noalignMonthlyTargetProdData, parentAlign, phaseType, noWells, prodData]);

	const [series, plotsWellIds] = useMemo(() => {
		const phaseColors = CHART_COLORS[curPhase];

		if (conversionLoaded && templatesLoaded && fitLoaded && noWells) {
			const fitPeak =
				phaseType === 'rate'
					? getRateFitPeak(fitSeries)
					: getRatioFitPeak(fitSeries, basePhaseFit[basePhaseSeries].segments);
			return Object.entries(fitPeak)
				.filter(([pSeries]) => activeChartSeries.has(pSeries))
				.reduce(
					(arr, [pSeries, pMax]) => [
						...arr,
						{
							...lineSeriesConfig({ color: phaseColors[`${pSeries}Fit`], forcedTooltip: true }),
							dataIgnoreSelection: true,
							tooltip: getTcTooltipStyles(phaseColors[`${pSeries}Fit`]),
							values: [
								[0, convert(pMax)],
								[100, convert(pMax)],
							],
							text: `${capitalize(pSeries)} Fit`,
						},
					],
					[]
				);
		}
		if (noalignMonthlyTargetProdData && prodC4 && conversionLoaded && templatesLoaded) {
			const { ip, percentile } = prodC4;

			// calculate individual percentiles
			const numericalPValues = NUMERICAL_P_VALUES.filter((pValue) => activeChartSeries.has(`wellsP${pValue}`));
			const calcP = calculatePercentile(ip, numericalPValues).map((val) => convert(val));

			// calculate average percentile
			const avgP = getAveragePercentile(ip.map((value) => convert(value)));

			const fitPeak =
				phaseType === 'rate'
					? getRateFitPeak(fitSeries)
					: getRatioFitPeak(fitSeries, basePhaseFit[basePhaseSeries].segments);
			let tempSeries = [];
			const wellList = [];

			if (!colorBy) {
				tempSeries.push({
					...scatterSeriesConfig({ color: phaseColors.peakRate, size: 5 }),
					id: 'wells',
					values: ip.map((value, valueIdx) => [percentile[valueIdx] * 100, convert(value)]),
					text: 'Wells Peak Rate',
					tooltip: tcTooltip(),
					...getChartHeaderInfo(wellIds, headersMap),
				});
				wellList.push(wellIds);
			} else {
				const groupedSeries = {};
				ip.forEach((value, valueIndex) => {
					const wellId = wellIds[valueIndex];
					const colorByValue =
						getHeaderValue({
							wellId,
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
							...getChartHeaderInfo(wellIds, headersMap),
							colorByValue,
						};
					}
					groupedSeries[colorByValue].values.push([percentile[valueIndex] * 100, convert(value)]);
					groupedSeries[colorByValue].wells.push(wellId);
				});
				Object.values(groupedSeries).forEach((thisSeries) => {
					const newObjectValues = {
						...getChartHeaderInfo(thisSeries.wells, headersMap),
					};
					Object.assign(thisSeries, newObjectValues);
					wellList.push(thisSeries.wells);
					tempSeries.push(thisSeries);
				});
			}
			const prodSeries = activeChartSeries.has('peakRate') ? tempSeries : [];
			const prodPSeries = numericalPValues.map((pValue, pIdx) => ({
				...lineSeriesConfig({
					color: phaseColors[`p${pValue}`],
					lineStyle: 'dashed',
				}),
				dataIgnoreSelection: true,
				text: `Wells P${pValue}`,
				tooltip: getTcTooltipStyles(phaseColors[`p${pValue}`]),
				values: [
					[0, calcP[pIdx]],
					[100, calcP[pIdx]],
				],
			}));

			const prodAvgSeries = {
				...lineSeriesConfig({
					color: phaseColors.average,
					lineStyle: 'dashed',
				}),
				dataIgnoreSelection: true,
				text: 'Wells Avg',
				tooltip: getTcTooltipStyles(phaseColors.average),
				values: [
					[0, avgP],
					[100, avgP],
				],
			};

			const fitPSeries = fitLoaded
				? Object.entries(fitPeak)
						.filter(([pSeries]) => activeChartSeries.has(pSeries))
						.reduce(
							(arr, [pSeries, pMax]) => [
								...arr,
								{
									...lineSeriesConfig({ color: phaseColors[`${pSeries}Fit`], forcedTooltip: true }),
									dataIgnoreSelection: true,
									tooltip: getTcTooltipStyles(phaseColors[`${pSeries}Fit`]),
									values: [
										[0, convert(pMax)],
										[100, convert(pMax)],
									],
									text: `${capitalize(pSeries)} Fit`,
								},
							],
							[]
						)
				: [];

			return [
				[
					...prodSeries,
					...prodPSeries,
					activeChartSeries.has('wellsAverage') && prodAvgSeries,
					...fitPSeries,
				].filter(Boolean),
				wellList,
			];
		}

		return [[], [wellIds]];
	}, [
		headersMap,
		wellIds,
		activeChartSeries,
		basePhaseFit,
		basePhaseSeries,
		colorBy,
		eurMap,
		noalignMonthlyTargetProdData,
		conversionLoaded,
		convert,
		curPhase,
		fitLoaded,
		fitSeries,
		phaseType,
		prodC4,
		templatesLoaded,
		noWells,
	]);

	const { yMin: settingsYMin, yMax: settingsYMax, enableLegend, yLogScale, fontSizeScale } = chartSettings;
	const { yMin, yMax } = useTcChartMinMax({
		yMin: settingsYMin,
		yMax: settingsYMax,
	});

	useEffect(() => {
		setYAxisLabel(defaultUnitTemplate[curPhase]);
	}, [curPhase, defaultUnitTemplate, setYAxisLabel]);

	const zcProps = useMemo(
		() => (activeChartSeries.has('peakRate') && !noWells ? { modules: 'selection-tool', selection } : {}),
		[activeChartSeries, selection, noWells]
	);

	return (
		<TcZingChart
			{...chartBehaviors}
			{...zcProps}
			selectionPlotsNodesIds={plotsWellIds}
			selectionPlotId='wells'
			data={{
				crosshairX: Zingchart.CROSSHAIR.SCALE,
				crosshairY: Zingchart.CROSSHAIR.SCALE,
				legend: { visible: enableLegend },
				plot: {
					hoverMarker: { backgroundColor: charts.hovered },
					selectedMarker: { backgroundColor: charts.selected },
				},
				scaleX: { ...genTCScaleX({ time: false, xLabel: 'Percentile', fontSizeScale }), step: 1 },
				scaleY: genScaleY({ log: yLogScale, minValue: yMin, maxValue: yMax, fontSizeScale }),
				selectType: 'multi-select',
				series,
				tooltip: { visible: true },
				type: 'mixed',
			}}
			useColorBy={Boolean(colorBy)}
			colorBySeriesType='distribution'
		/>
	);
};

export default InitialPeakChart;
