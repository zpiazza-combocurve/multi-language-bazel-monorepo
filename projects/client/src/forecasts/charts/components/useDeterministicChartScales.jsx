import { useMemo } from 'react';

import { getOperations } from '@/forecasts/charts/components/helpers';
import useDeterministicChartMinMax from '@/forecasts/charts/components/useDeterministicChartMinMax';
import { genLegendConfig, genScaleX, genScaleY } from '@/helpers/zing';

const useDeterministicChartScales = (props) => {
	const { dataTable, chartSettings, seriesItems, verticalDateBars, xAxisUsingNumericUnits } = props;

	const { xMin, xMax, yMin, yMax } = useDeterministicChartMinMax({
		dataTable,
		chartSettings,
		seriesItems,
		xAxisUsingNumericUnits,
	});

	const [scaleXOut, scaleYOut, legendOut] = useMemo(() => {
		const {
			enableDailyOperations,
			enableLegend = true,
			enableMonthlyOperations,
			xAxis,
			xLogScale,
			yLogScale,
		} = chartSettings;

		let xConfig = {
			time: true,
			xLogScale,
			minValue: xMin,
			maxValue: xMax,
		};

		if (xAxis === 'time') {
			xConfig = { ...xConfig, time: true, xLogScale: false };
		}
		if (xAxis === 'relativeTime' || xAxisUsingNumericUnits) {
			xConfig.time = false;
		}

		const legend = enableLegend ? genLegendConfig() : undefined;
		const scaleX = genScaleX(xConfig);
		const scaleY = genScaleY({ log: yLogScale, minValue: yMin, maxValue: yMax });

		const { monthly, daily } = getOperations(dataTable, xAxis);
		scaleX.markers = [];

		if (enableMonthlyOperations) {
			scaleX.markers = [...monthly];
		}
		if (enableDailyOperations) {
			scaleX.markers = [...scaleX.markers, ...daily];
		}
		if (verticalDateBars?.length) {
			scaleX.markers = [...scaleX.markers, ...verticalDateBars];
		}

		return [scaleX, scaleY, legend];
	}, [chartSettings, xMin, xMax, xAxisUsingNumericUnits, yMin, yMax, dataTable, verticalDateBars]);

	return Object.assign([scaleXOut, scaleYOut, legendOut], {
		scaleX: scaleXOut,
		scaleY: scaleYOut,
		legend: legendOut,
	});
};

export default useDeterministicChartScales;
