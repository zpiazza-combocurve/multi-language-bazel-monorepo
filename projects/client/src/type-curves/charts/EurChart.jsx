import { useTheme } from '@material-ui/core';
import { useEffect, useMemo } from 'react';

import Zingchart from '@/components/Zingchart';
import { useUnitTemplates } from '@/forecasts/shared';
import { useTcConvertFunc } from '@/forecasts/shared/getUnitTemplates';
import { calculatePercentile } from '@/helpers/math';
import { capitalize } from '@/helpers/text';
import { PROXIMITY_TARGET_WELL_COLOR, genScaleY, lineSeriesConfig, scatterSeriesConfig } from '@/helpers/zing';
import { getHeaderValue, getInput } from '@/type-curves/charts/HeaderChart';
import {
	FIT_OBJECT,
	NUMERICAL_P_VALUES,
	getAveragePercentile,
	getPNumTimeArr,
} from '@/type-curves/charts/graphProperties';
import {
	CHART_COLORS,
	TcZingChart,
	getChartHeaderInfo,
	getTcTooltipStyles,
	tcTooltip,
	useTcChartMinMax,
} from '@/type-curves/charts/shared';
import { genTCScaleX } from '@/type-curves/shared/tcChartConfig';

const EMPTY_OBJECT = {};

const EurChart = (props) => {
	const {
		activeChartSeries,
		chartBehaviors = {},
		chartSettings,
		colorBy,
		curPhase,
		eurData,
		eurMap,
		eurs,
		fitLoaded,
		fitSeries,
		headersMap,
		noWells,
		selection,
		setYAxisLabel,
		wellIds,
		proximityProps,
	} = props;

	const {
		palette: { charts },
	} = useTheme();

	const phaseColors = CHART_COLORS[curPhase];

	const unitTemplates = useUnitTemplates();
	const { defaultUnitTemplate, loaded: templatesLoaded } = unitTemplates;

	const templateKey = useMemo(() => `${curPhase}_eur`, [curPhase]);
	const { convert, loaded: conversionLoaded } = useTcConvertFunc(templateKey);

	const { eur: targetWellEur } = proximityProps?.targetWellHeaderAndEur ?? EMPTY_OBJECT;

	const noWellsSeries = useMemo(() => {
		if (conversionLoaded && templatesLoaded && fitLoaded && noWells) {
			return Object.keys(FIT_OBJECT)
				.filter((pSeries) => activeChartSeries.has(pSeries))
				.reduce((arr, pSeries) => {
					const pValue = fitSeries[pSeries];
					const { segments } = pValue;
					if (!segments?.length) {
						return arr;
					}

					const eurValue = convert(eurs[curPhase][pSeries]);

					return [
						...arr,
						{
							...lineSeriesConfig({ color: phaseColors[`${pSeries}Fit`], forcedTooltip: true }),
							tooltip: getTcTooltipStyles(phaseColors[`${pSeries}Fit`]),
							values: [
								[0, eurValue],
								[100, eurValue],
							],
							text: `${capitalize(pSeries)} Fit`,
						},
					];
				}, []);
		}
		return [];
	}, [
		activeChartSeries,
		conversionLoaded,
		convert,
		curPhase,
		eurs,
		fitLoaded,
		fitSeries,
		noWells,
		phaseColors,
		templatesLoaded,
	]);

	const [series, plotsWellIds] = useMemo(() => {
		if (eurData && conversionLoaded && templatesLoaded) {
			const { eur, percentile } = eurData;

			// calculate individual percentiles
			const numericalPValues = NUMERICAL_P_VALUES.filter((pValue) => activeChartSeries.has(`wellsP${pValue}`));
			const calcP = calculatePercentile(eur, numericalPValues).map((val) => convert(val));
			// calculate average percentile
			const avgP = getAveragePercentile(eur.map((value) => convert(value)));
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

			let tempSeries = [];
			const wellList = [];
			if (!colorBy) {
				tempSeries.push({
					id: 'wells',
					...scatterSeriesConfig({ color: phaseColors.eurDistribution, size: 5 }),
					values: eur.map((value, valueIdx) => [percentile[valueIdx] * 100, convert(value)]),
					text: 'EUR Distribution',
					...getChartHeaderInfo(wellIds, headersMap),
					tooltip: tcTooltip(),
					zIndex: 1,
				});
				wellList.push(wellIds);
			} else {
				const groupedSeries = {};
				eur.forEach((value, valueIndex) => {
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
			const eurSeries = activeChartSeries.has('wellsEur') ? tempSeries : [];
			return [
				[
					...eurSeries,
					...prodPSeries,
					activeChartSeries.has('wellsAverage') && {
						...lineSeriesConfig({
							color: phaseColors.average,
							lineStyle: 'dashed',
						}),
						dataIgnoreSelection: true,
						text: 'Wells Average',
						tooltip: getTcTooltipStyles(phaseColors.average),
						values: [
							[0, avgP],
							[100, avgP],
						],
					},
					...(fitLoaded
						? Object.keys(FIT_OBJECT)
								.filter((pSeries) => activeChartSeries.has(pSeries))
								.map((pSeries) => {
									const pValue = fitSeries[pSeries];
									const { segments } = pValue;
									if (!segments?.length) {
										return false;
									}

									const eurValue = convert(eurs[curPhase][pSeries]);
									const color = phaseColors[`${pSeries}Fit`];
									return {
										...lineSeriesConfig({
											color,
											forcedTooltip: true,
										}),
										dataIgnoreSelection: true,
										tooltip: getTcTooltipStyles(color),
										values: [
											[0, eurValue],
											[100, eurValue],
										],
										text: `${capitalize(pSeries)} Fit`,
									};
								})
						: []),
				].filter(Boolean),
				wellList,
			];
		}

		return [[], [wellIds]];
	}, [
		activeChartSeries,
		conversionLoaded,
		colorBy,
		convert,
		curPhase,
		eurData,
		eurMap,
		eurs,
		fitLoaded,
		fitSeries,
		headersMap,
		phaseColors,
		templatesLoaded,
		wellIds,
	]);

	const { yMin: settingsYMin, yMax: settingsYMax, enableLegend, yLogScale, fontSizeScale } = chartSettings;

	const { yMin, yMax } = useTcChartMinMax({
		yMin: settingsYMin,
		yMax: settingsYMax,
	});

	useEffect(() => {
		setYAxisLabel(defaultUnitTemplate[templateKey]);
	}, [defaultUnitTemplate, setYAxisLabel, templateKey]);

	const zcProps = useMemo(
		() => (activeChartSeries.has('wellsEur') && !noWells ? { modules: 'selection-tool', selection } : {}),
		[activeChartSeries, selection, noWells]
	);
	const plotSeries = useMemo(() => {
		const ret = noWells ? noWellsSeries : series;
		if (targetWellEur) {
			ret.push({
				id: `target${capitalize(curPhase)}`,
				text: `Target Well EUR`,
				...lineSeriesConfig({
					forcedTooltip: true,
					color: PROXIMITY_TARGET_WELL_COLOR,
				}),
				values: getPNumTimeArr().map((index) => [index, convert(targetWellEur[curPhase])]),
				tooltip: { ...getTcTooltipStyles(PROXIMITY_TARGET_WELL_COLOR) },
			});
		}
		return ret;
	}, [noWells, noWellsSeries, series, targetWellEur, curPhase, convert]);

	return (
		<TcZingChart
			{...chartBehaviors}
			{...zcProps}
			selectionPlotsNodesIds={plotsWellIds}
			data={{
				crosshairX: Zingchart.CROSSHAIR.SCALE,
				crosshairY: Zingchart.CROSSHAIR.SCALE,
				legend: { visible: enableLegend },
				plot: {
					hoverMarker: { backgroundColor: charts.hovered, type: 'circle' },
					selectedMarker: { backgroundColor: charts.selected },
				},
				scaleX: { ...genTCScaleX({ time: false, xLabel: 'Percentile', fontSizeScale }), step: 1 },
				scaleY: genScaleY({ log: yLogScale, minValue: yMin, maxValue: yMax, fontSizeScale }),
				selectType: 'multi-select',
				series: plotSeries,
				tooltip: { visible: true },
				type: 'mixed',
			}}
			useColorBy={Boolean(colorBy)}
			colorBySeriesType='distribution'
		/>
	);
};

export default EurChart;
