import { useEffect, useMemo } from 'react';

import { Placeholder } from '@/components/Placeholder';
import Zingchart from '@/components/Zingchart';
import { MTD_DENOM } from '@/forecasts/charts/forecastChartHelper';
import { useUnitTemplates } from '@/forecasts/shared';
import { useTcConvertFunc } from '@/forecasts/shared/getUnitTemplates';
import { createMatrix, getCumArr, sumMatrixRows } from '@/helpers/math';
import { capitalize } from '@/helpers/text';
import { convertIdxToMilli, genScaleY, lineSeriesConfig } from '@/helpers/zing';
import { getMaxProdTime } from '@/type-curves/charts/graphProperties';
import {
	CHART_COLORS,
	P_SERIES_LINE_STYLES,
	TcZingChart,
	getFitArr,
	getTcTooltipStyles,
	useTcChartMinMax,
	validateCumData,
} from '@/type-curves/charts/shared';
import { genTCScaleX } from '@/type-curves/shared/tcChartConfig';

const getCumFit = ({ cumData, fitSeries, basePhaseFit, basePhaseSeries, phaseType }) => {
	if (!validateCumData(cumData)) {
		return {};
	}

	const { idx, cum_subind } = cumData;
	return fitSeries
		? Object.entries(fitSeries).reduce((obj, [pSeries, seriesValue]) => {
				const { segments } = seriesValue;
				if (!segments?.length) {
					return obj;
				}

				const fitArr = getFitArr({
					timeArrLength: idx.length,
					segments,
					phaseType,
					basePhaseFit,
					basePhaseSeries,
				});
				const matrix = createMatrix(cum_subind.length, idx.length);

				for (let wellIdx = 0; wellIdx < cum_subind.length; wellIdx++) {
					const [leftIdx, rightIdx] = cum_subind[wellIdx];
					let zeroIdx = 0;
					matrix[wellIdx] = matrix[wellIdx].map((val, colIdx) => {
						if (colIdx >= leftIdx && colIdx < rightIdx) {
							return fitArr[zeroIdx++];
						}

						return val;
					});
				}

				const sum = sumMatrixRows(matrix);
				return { ...obj, [pSeries]: getCumArr(sum) };
		  }, {})
		: {};
};

const CumChart = ({
	activeChartSeries,
	basePhaseFit,
	basePhaseSeries,
	chartBehaviors = {},
	chartSettings,
	curPhase,
	cumData,
	fitLoaded,
	fitSeries = {},
	noWells,
	phaseType,
	setXAxisLabel,
	setYAxisLabel,
}) => {
	const unitTemplates = useUnitTemplates();
	const { defaultUnitTemplate, loaded: templatesLoaded } = unitTemplates;

	const cumReady = cumData && !noWells;
	const fitCumDict = useMemo(
		() => getCumFit({ cumData, fitSeries, basePhaseFit, basePhaseSeries, phaseType }),
		[basePhaseFit, basePhaseSeries, fitSeries, phaseType, cumData]
	);

	const templateKey = useMemo(() => `cumsum_${curPhase}`, [curPhase]);
	const { convert, loaded: conversionLoaded } = useTcConvertFunc(templateKey);

	const series = useMemo(() => {
		if (!cumReady || !conversionLoaded || !templatesLoaded) {
			return [];
		}

		const phaseColors = CHART_COLORS[curPhase];

		const { idx: prodIdx, cum: prodValues } = cumData;
		const prodSeries = {
			...lineSeriesConfig({ color: phaseColors.cum, lineWidth: '4px' }),
			showInLegend: true,
			text: 'Wells Cum',
			values: prodValues.map((value, idx) => [convertIdxToMilli(prodIdx[idx]), convert(value * MTD_DENOM)]),
			dataIgnoreSelection: true,
		};

		const cumFitSeries = fitLoaded
			? Object.entries(fitCumDict)
					.filter(([pSeries]) => activeChartSeries.has(pSeries))
					.reduce((arr, [pSeries, cumArr]) => {
						const color = phaseColors[`${pSeries}Fit`];
						const config = lineSeriesConfig({
							color,
							lineWidth: '4px',
							lineStyle: P_SERIES_LINE_STYLES[pSeries],
						});
						const values = cumArr.map((cumValue, idx) => [
							convertIdxToMilli(prodIdx[idx]),
							convert(cumValue * MTD_DENOM),
						]);
						return [
							...arr,
							{
								...config,
								tooltip: getTcTooltipStyles(color),
								showInLegend: true,
								text: `${capitalize(pSeries)} Fit`,
								values,
								dataIgnoreSelection: true,
							},
						];
					}, [])
			: [];

		return [activeChartSeries.has('cum') && prodSeries, ...cumFitSeries].filter(Boolean);
	}, [
		activeChartSeries,
		conversionLoaded,
		convert,
		curPhase,
		fitCumDict,
		fitLoaded,
		cumData,
		templatesLoaded,
		cumReady,
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

	const { xMin, xMax, yMin, yMax } = useTcChartMinMax({
		maxProdTime: useMemo(() => getMaxProdTime(series), [series]),
		xType: 'time',
		yearsBefore,
		yearsPast,
		yMax: settingsYMax,
		yMin: settingsYMin,
	});

	useEffect(() => {
		setYAxisLabel(defaultUnitTemplate[templateKey]);
		setXAxisLabel('');
	}, [defaultUnitTemplate, setYAxisLabel, setXAxisLabel, templateKey]);

	if (noWells) {
		return <Placeholder empty={noWells} text='Disabled when no rep wells.' />;
	}

	return (
		<TcZingChart
			{...chartBehaviors}
			data={{
				crosshairX: Zingchart.CROSSHAIR.SCALE,
				crosshairY: Zingchart.CROSSHAIR.SCALE,
				legend: { visible: enableLegend },
				scaleX: genTCScaleX({ time: true, minValue: xMin, maxValue: xMax, fontSizeScale }),
				scaleY: genScaleY({ log: yLogScale, minValue: yMin, maxValue: yMax, fontSizeScale }),
				series,
				type: 'fastline',
				plotarea: { marginRight: '40rem' },
			}}
			modules='fastline'
		/>
	);
};

export default CumChart;
