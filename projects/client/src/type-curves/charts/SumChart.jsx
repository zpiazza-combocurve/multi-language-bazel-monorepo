import { useEffect, useMemo } from 'react';

import { Placeholder } from '@/components/Placeholder';
import Zingchart from '@/components/Zingchart';
import { useUnitTemplates } from '@/forecasts/shared';
import { useTcConvertFunc } from '@/forecasts/shared/getUnitTemplates';
import { createMatrix, sumMatrixRows } from '@/helpers/math';
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

const getSumFit = ({ cumData, fitSeries, basePhaseFit, basePhaseSeries, phaseType }) => {
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

				return { ...obj, [pSeries]: sumMatrixRows(matrix) };
		  }, {})
		: {};
};

const SumChart = (props) => {
	const {
		activeChartSeries,
		basePhaseFit,
		basePhaseSeries,
		chartBehaviors = {},
		chartSettings,
		cumData,
		curPhase,
		fitLoaded,
		fitSeries = {},
		noWells,
		phaseType,
		setXAxisLabel,
		setYAxisLabel,
	} = props;

	const unitTemplates = useUnitTemplates();
	const { defaultUnitTemplate, loaded: templatesLoaded } = unitTemplates;

	const sumLoaded = cumData && !noWells;

	const fitCumDict = useMemo(
		() => (sumLoaded ? getSumFit({ cumData, fitSeries, basePhaseFit, basePhaseSeries, phaseType }) : {}),
		[basePhaseFit, basePhaseSeries, fitSeries, phaseType, cumData, sumLoaded]
	);

	const { convert, loaded: conversionLoaded } = useTcConvertFunc(curPhase);

	const { series, maxProdTime } = useMemo(() => {
		if (!sumLoaded) {
			return { series: [], maxProdTime: null };
		}

		if (conversionLoaded && templatesLoaded) {
			const { idx: prodIdx, sum: prodValues } = cumData;
			const phaseColors = CHART_COLORS[curPhase];

			const prodSeries = {
				dataIgnoreSelection: true,
				...lineSeriesConfig({ color: phaseColors.sum, lineWidth: '4px' }),
				tooltip: getTcTooltipStyles(phaseColors.sum),
				showInLegend: true,
				text: 'Wells Sum',
				values: prodValues.map((value, idx) => [convertIdxToMilli(prodIdx[idx]), convert(value)]),
			};

			const sumFitSeries = fitLoaded
				? Object.entries(fitCumDict)
						.filter(([pSeries]) => activeChartSeries.has(pSeries))
						.reduce((arr, [pSeries, sumArr]) => {
							const color = phaseColors[`${pSeries}Fit`];
							const config = lineSeriesConfig({
								color,
								lineWidth: '4px',
								lineStyle: P_SERIES_LINE_STYLES[pSeries],
							});
							const values = sumArr.map((sumValue, idx) => [
								convertIdxToMilli(prodIdx[idx]),
								convert(sumValue),
							]);

							return [
								...arr,
								{
									...config,
									dataIgnoreSelection: true,
									tooltip: getTcTooltipStyles(color),
									showInLegend: true,
									text: `${capitalize(pSeries)} Fit`,
									values,
								},
							];
						}, [])
				: [];

			const retSeries = [activeChartSeries.has('sum') && prodSeries, ...sumFitSeries].filter(Boolean);
			return { series: retSeries, maxProdTime: getMaxProdTime(retSeries) };
		}

		return { series: [], maxProdTime: null };
	}, [
		activeChartSeries,
		conversionLoaded,
		convert,
		cumData,
		curPhase,
		fitCumDict,
		fitLoaded,
		sumLoaded,
		templatesLoaded,
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
		maxProdTime,
		xType: 'time',
		yearsBefore,
		yearsPast,
		yMax: settingsYMax,
		yMin: settingsYMin,
	});

	useEffect(() => {
		setYAxisLabel(defaultUnitTemplate[curPhase]);
		setXAxisLabel('');
	}, [curPhase, defaultUnitTemplate, setYAxisLabel, setXAxisLabel]);

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

export default SumChart;
