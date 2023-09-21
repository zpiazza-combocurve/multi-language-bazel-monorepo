import { useTheme } from '@material-ui/core';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';

import { useMergedState } from '@/components/hooks';
import { useUnitTemplates } from '@/forecasts/shared';
import { useTcConvertFunc } from '@/forecasts/shared/getUnitTemplates';
import { calculateChiSquared, mean, probit, stDev } from '@/helpers/math';
import { ColorBySeriesObject, lineSeriesConfig, scaleItemFontSize } from '@/helpers/zing';
import { getHeaderValue, getInput } from '@/type-curves/charts/HeaderChart';
import {
	CHART_COLORS,
	PROBIT_MODEL_COLORS,
	TcZingChart,
	getChartHeaderInfo,
	tcTooltip,
	useTcChartMinMax,
} from '@/type-curves/charts/shared';

import { SharedChartProps } from './types';

const MAX_Y = 0.999;
const MIN_Y = 0.001;

declare global {
	interface Window {
		probitScale: { values: () => number[]; valueToCoord: (number) => number };
	}
}

// custom y axis
// zingchart will try to evaluate the value starting from the window context. See node_modules/zc-inside-petroleum/demos/2022_03_24 for more info
window.probitScale = {
	// returns an array of values for the scale
	values() {
		return [99.9, 99, 95, 90, 75, 50, 25, 10, 5, 1, 0.1];
	},
	// returns a number between 0 and 1 representing the ratio between the value and the reference value (usually the minimum value)
	// as an example, if the progression would be linear and scale is between 0 and 50, the function would return 0.5 for value=25 and 0.2 for value=10
	valueToCoord(fValue) {
		const fRatio = (probit(MAX_Y) - probit(fValue * 0.01)) / (probit(MAX_Y) - probit(MIN_Y));
		return fRatio;
	},
};

function distributeValues(values: number[], useStatConvention = false): [number, number][] {
	// Plotting according to the 'Blom position.' See https://insidepetroleum.slack.com/archives/CQ34663CJ/p1653329228356099
	if (values.length === 0) {
		return [];
	}
	const tot = values.length;
	const getValue = (value: number, index: number): [number, number] => {
		return useStatConvention
			? [value, ((tot - index - 0.375) / (tot + 0.25)) * 100]
			: [value, ((index + 1 - 0.375) / (tot + 0.25)) * 100];
	};
	return values.map((value, index) => getValue(value, index));
}

const useProbitChartState = () => {
	const [probitState, setProbitState] = useMergedState({
		displayProbitStats: false,
		useStatConvention: false,
	});

	return {
		probitState,
		setProbitState,
	};
};

interface ProbitChartProps extends SharedChartProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeChartSeries: any;
	displayProbitStats: boolean;
	noWells: boolean;
	typeCurveId: string;
	useStatConvention: boolean;
	setXAxisLabel: (string) => void;
	xAxisLabel: string;
}

// https://verdazo.com/blog/type-curves-part-1-definitions-and-chart-types/
const ProbitChart = (props: ProbitChartProps) => {
	const {
		activeChartSeries,
		chartBehaviors = {},
		chartSettings,
		colorBy,
		curPhase,
		displayProbitStats,
		eurData,
		eurMap,
		headersMap,
		noWells,
		selection,
		wellIds,
		useStatConvention = false,
		setXAxisLabel,
		xAxisLabel,
	} = props;
	const {
		palette: { charts, ...muiPalette },
	} = useTheme();

	const { cumMin, cumMax, enableLegend } = chartSettings;

	const { xMin: settingsXMin, xMax: settingsXMax } = useTcChartMinMax({
		cumMin,
		cumMax,
	});

	const templateKey = useMemo(() => `${curPhase}_eur`, [curPhase]);
	const { convert } = useTcConvertFunc(templateKey);

	const { eur } = eurData ?? {};

	const { values, sortedIds } = useMemo(() => {
		const convertedEur = eur?.map(convert) ?? [];
		const sortedIndexes = _.range(0, convertedEur.length).sort((a, b) => convertedEur[b] - convertedEur[a]);
		return {
			values: distributeValues(
				sortedIndexes.map((i) => convertedEur[i]),
				useStatConvention
			),
			sortedIds: sortedIndexes.map((i) => wellIds[i]),
		};
	}, [eur, convert, useStatConvention, wellIds]);

	const phaseColors = CHART_COLORS[curPhase];

	const unitTemplates = useUnitTemplates();
	const { defaultUnitTemplate } = unitTemplates;
	useEffect(() => {
		setXAxisLabel(defaultUnitTemplate[templateKey]);
	}, [defaultUnitTemplate, setXAxisLabel, templateKey]);

	const { fontSizeScale } = chartSettings;

	const { fit, m, b, sampleMean, sampleStDev } = useMemo(() => {
		if (values.length < 1) {
			return { fit: null, m: null, b: null };
		}

		const sampleValues = values.map(([x, _]) => x);
		const sampleMean = mean(sampleValues);
		const sampleStDev = stDev(sampleValues);

		const logSampleValues = values.map(([x, _]) => Math.log(x));
		const logSampleMean = mean(logSampleValues);
		const logSampleStDev = stDev(logSampleValues);
		if (logSampleMean === null || logSampleStDev === null) {
			return { fit: null, m: null, b: null };
		}

		// The z-scores of 0.001 and 0.999 are -+3.0899284059120644, respectively.
		const zScoreBounds = useStatConvention
			? [-3.0899284059120644, 3.0899284059120644]
			: [3.0899284059120644, -3.0899284059120644];
		const logScaleXticks = zScoreBounds.map((x) => logSampleMean + logSampleStDev * x);
		const yBounds = [MIN_Y, MAX_Y];
		const m = useStatConvention
			? -(zScoreBounds[0] - zScoreBounds[1]) / (logScaleXticks[1] - logScaleXticks[0])
			: (zScoreBounds[0] - zScoreBounds[1]) / (logScaleXticks[1] - logScaleXticks[0]);
		const b = useStatConvention ? zScoreBounds[1] - m * logScaleXticks[1] : zScoreBounds[1] - m * logScaleXticks[0];
		return {
			fit: logScaleXticks.map((x, i) => {
				const linearScaleXtick = Math.exp(x);
				return [linearScaleXtick, yBounds[i] * 100];
			}),
			m,
			b,
			sampleMean,
			sampleStDev,
		};
	}, [useStatConvention, values]);

	const [xMin, xMax] = useMemo(() => {
		if (!values.length) {
			return [0, 0];
		}
		const maxValue = values[0][0];
		const minValue = values[values.length - 1][0];
		if (!fit) {
			return [minValue / 2, maxValue * 2];
		}
		const maxFit = fit[0][0];
		const minFit = fit[fit.length - 1][0];
		const arr = [minValue, minFit, maxValue, maxFit];
		let min = Math.min(...arr);
		let max = Math.max(...arr);
		min = min <= 2 ? min : min / 2;
		max = max >= 1000 ? max : max * 2;
		return [settingsXMin ?? min, settingsXMax ?? max];
	}, [fit, settingsXMax, settingsXMin, values]);

	const [eurSeries, plotsWellIds] = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const tempSeries: any[] = [];
		const wellList: string[][] = [];
		if (!colorBy) {
			tempSeries.push({
				id: 'wells',
				type: 'scatter',
				text: 'EUR Distribution',
				values,
				lineColor: phaseColors.eurDistribution,
				marker: { backgroundColor: phaseColors.eurDistribution },
				tooltip: tcTooltip(),
				...getChartHeaderInfo(sortedIds, headersMap),
				zIndex: 1,
			});
			wellList.push(sortedIds);
		} else {
			const groupedSeries: ColorBySeriesObject = {};
			values.forEach((value, valueIndex) => {
				const wellId = sortedIds[valueIndex];
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
				groupedSeries[colorByValue].values.push(value);
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

		return [tempSeries, wellList];
	}, [colorBy, eurMap, headersMap, phaseColors.eurDistribution, sortedIds, values, wellIds]);

	const pSeries = useMemo(
		() =>
			values.length
				? [
						{
							...lineSeriesConfig({
								color: PROBIT_MODEL_COLORS[`P10Fit`],
							}),
							dataIgnoreSelection: true,
							text: 'Model P10',
							lineWidth: 3,
							values: [
								[xMin / 10, 10],
								[xMax * 10, 10],
							],
						},
						{
							...lineSeriesConfig({
								color: PROBIT_MODEL_COLORS[`P50Fit`],
							}),
							dataIgnoreSelection: true,
							lineWidth: 3,
							values: [
								[xMin / 10, 50],
								[xMax * 10, 50],
							],
							text: 'Model P50',
						},
						{
							...lineSeriesConfig({
								color: PROBIT_MODEL_COLORS[`P90Fit`],
							}),
							dataIgnoreSelection: true,
							lineWidth: 3,
							text: 'Model P90',
							values: [
								[xMin / 10, 90],
								[xMax * 10, 90],
							],
						},
						{
							...lineSeriesConfig({
								color: phaseColors.average,
							}),
							dataIgnoreSelection: true,
							lineWidth: 3,
							values: [
								[sampleMean, 0.1],
								[sampleMean, 99.9],
							],
							text: 'Wells Average',
						},
				  ]
				: [],
		[phaseColors, sampleMean, values.length, xMax, xMin]
	);

	const probitLabels = useMemo(() => {
		if (!displayProbitStats) {
			return [];
		}

		let P01: number | null = null;
		let P10: number | null = null;
		let P50: number | null = null;
		let P90: number | null = null;
		let P99: number | null = null;
		let PRatio: string | null = null;
		let probitChi2: string | null = null;
		let probitMean: string | null = null;
		let probitStDev: string | null = null;

		const text: string[] = [];
		if (values?.length < 2 || b === null || m === null) {
			text.push(
				`P01: N/A`,
				`P10: N/A`,
				`P50: N/A`,
				`P90: N/A`,
				`P99: N/A`,
				`\u03c72: N/A`,
				`P10/P90 Ratio: N/A`,
				`Mean: N/A`,
				`Standard Dev: N/A`
			);
		} else {
			probitMean = sampleMean ? sampleMean.toFixed(2) : Number(0).toFixed(2);
			probitStDev = sampleStDev ? sampleStDev.toFixed(2) : Number(0).toFixed(2);
			// Calculate the chiSquared statistic.
			const BIN_SIZE = 8;
			const binNum = Math.min(Math.max(Math.ceil(values.length / BIN_SIZE), 4), 101);
			const binWidth = 1 / binNum;
			const binBoundaries = [...Array(binNum - 1).keys()].map((i) =>
				useStatConvention
					? Math.exp((probit((i + 1) * binWidth) - b) / m)
					: Math.exp(-(probit((i + 1) * binWidth) + b) / m)
			);
			const observed = Array(binNum).fill(0);
			let i = 0;
			let j = 0;
			const checkValues = values.map((_, i) => values[values.length - 1 - i]);
			for (; i < binNum - 1; i++) {
				while (checkValues[j][0] < binBoundaries[i]) {
					observed[i]++;
					j++;
					if (j === values.length) break;
				}
				if (j === values.length) break;
			}
			observed[observed.length - 1] = checkValues.length - j;
			const expected = Array(binNum).fill(values.length * binWidth);
			probitChi2 = calculateChiSquared(expected, observed).toFixed(4);
			const chiReport = `(df=${binNum - 1}, N=${values.length}) = ${probitChi2}`;

			const pValues = [0.01, 0.1, 0.5, 0.9, 0.99].map((x) => Math.exp((probit(x) - b) / m));
			[P01, P10, P50, P90, P99] = pValues;

			PRatio = P10 && P90 ? (P10 / P90).toFixed(2) : null;
			text.push(
				'',
				`Well Mean: ${probitMean} ${xAxisLabel}`,
				`Well Standard Dev: ${probitStDev} ${xAxisLabel}`,
				`\u03c72: ${chiReport}`,
				'',
				'Model Statistics',
				`P01: ${P01.toFixed(1)} ${xAxisLabel}`,
				`P10: ${P10.toFixed(1)} ${xAxisLabel}`,
				`P50: ${P50.toFixed(1)} ${xAxisLabel}`,
				`P90: ${P90.toFixed(1)} ${xAxisLabel}`,
				`P99: ${P99.toFixed(1)} ${xAxisLabel}`,
				`P10/P90 Ratio: ${PRatio}`
			);
		}

		return [
			{
				text: text.join('<br />'),
				lineHeight: 16,
				bold: true,
				x: '12%',
				y: useStatConvention ? 0.325 : 0.075,
				backgroundColor: muiPalette.background.default,
				border: '1',
				borderColor: muiPalette.text.primary,
				color: muiPalette.text.primary,
				width: 225,
				height: 210,
				textAlign: 'left',
				padding: '16 8 8 8',
			},
			{
				text: 'Probit Model Statistics',
				bold: true,
				x: '12%',
				y: useStatConvention ? 0.325 : 0.075,
				color: muiPalette.text.primary,
				width: 225,
				height: 20,
				textAlign: 'center',
				padding: '0',
			},
		];
	}, [b, displayProbitStats, m, muiPalette, sampleMean, sampleStDev, useStatConvention, values, xAxisLabel]);

	const zcProps =
		activeChartSeries.has('wellsEur') && !noWells
			? { modules: 'selection-tool', selection, selectionPlotsNodesIds: plotsWellIds }
			: {};

	return (
		<TcZingChart
			{...chartBehaviors}
			{...zcProps}
			data={{
				crosshairX: {
					plotLabel: {
						visible: false,
					},
					scaleLabel: {
						visible: false,
					},
					visible: false,
				},
				crosshairY: {
					plotLabel: {
						visible: false,
					},
					scaleLabel: {
						visible: false,
					},
					visible: false,
				},
				labels: probitLabels,
				legend: { visible: enableLegend },
				plot: {
					hoverMarker: { backgroundColor: charts.hovered, type: 'circle' },
					selectedMarker: { backgroundColor: charts.selected },
				},
				scaleX: {
					progression: 'log',
					zooming: false,
					item: { fontSize: scaleItemFontSize(fontSizeScale) },
					minValue: xMin,
					maxValue: xMax,
				},
				scaleY: {
					label: { text: 'Percentile' },
					labels: ['P99.9', 'P99', 'P95', 'P90', 'P75', 'P50', 'P25', 'P10', 'P5', 'P1', 'P0.1'],
					progression: 'probitScale',
					zooming: false,
					item: { fontSize: scaleItemFontSize(fontSizeScale) },
					minorTicks: undefined,
				},
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				selectType: 'multi-select',
				series: [
					...eurSeries,
					fit
						? {
								// change line color based on light/dark theme
								...lineSeriesConfig({
									color: muiPalette.text.primary,
								}),
								dataIgnoreSelection: true,
								text: 'Probit Model Fit',
								values: fit,
						  }
						: { legendItem: { visible: false } },
					...pSeries,
				],
				tooltip: { visible: true },
				type: 'mixed',
			}}
			useColorBy={Boolean(colorBy)}
			colorBySeriesType='scatter'
		/>
	);
};

export default ProbitChart;
export { useProbitChartState };
