import _ from 'lodash-es';
import { useCallback, useEffect, useMemo } from 'react';

import Zingchart from '@/components/Zingchart';
import { getConvertFunc } from '@/helpers/units';
import { ZingchartSerie, genScaleY, phases } from '@/helpers/zing';
import { CHART_COLORS, TcZingChart, useTcChartMinMax } from '@/type-curves/charts/shared';

import { genTCScaleX } from '../shared/tcChartConfig';
import { dailyUnitTemplate, defaultUnitTemplate, generateC4FitSeries } from './C4Chart';

const convertDailyToMonthly = getConvertFunc('D', 'M');

const ThreePhaseFit = (props) => {
	const {
		activeChartSeries,
		allAlignAdjustedFitSeries,
		basePhase,
		c4RatioShowRate,
		chartBehaviors = {},
		chartSettings,
		getShiftBaseSegments,
		phaseType,
		setXAxisLabel,
		setYAxisLabel,
		showDaily,
	} = props;

	const xConvert = useCallback((value) => (showDaily ? value : convertDailyToMonthly(value)), [showDaily]);
	const fitSeries = useMemo(() => {
		const phaseSeries = Object.values(phases).map(({ value: curPhase }) => {
			const phaseColors = CHART_COLORS[curPhase];
			const unitKey =
				phaseType === 'rate' || (phaseType === 'ratio' && c4RatioShowRate)
					? curPhase
					: `${curPhase}/${basePhase}`;

			const convert = getConvertFunc(dailyUnitTemplate[unitKey], defaultUnitTemplate[unitKey]);

			const alignAdjustedFitSeries = allAlignAdjustedFitSeries[curPhase];
			const series = generateC4FitSeries(
				activeChartSeries,
				c4RatioShowRate,
				convert,
				alignAdjustedFitSeries,
				getShiftBaseSegments,
				phaseColors,
				phaseType,
				xConvert,
				{ fit: { lineStyle: 'solid' } }
			) as ZingchartSerie[];
			const titlePhase = _.startCase(_.toLower(curPhase));
			return series.map(({ text, ...series }) => ({
				...series,
				dataIgnoreSelection: true,
				text: `${titlePhase} ${text}`,
			}));
		});

		return phaseSeries.flat();
	}, [
		activeChartSeries,
		basePhase,
		c4RatioShowRate,
		allAlignAdjustedFitSeries,
		getShiftBaseSegments,
		phaseType,
		xConvert,
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
		xType: 'relativeTime',
		yearsBefore,
		yearsPast,
		yMax: settingsYMax,
		yMin: settingsYMin,
	});

	setYAxisLabel(`${defaultUnitTemplate['oil']} and ${defaultUnitTemplate['gas']}`);

	useEffect(() => setXAxisLabel(showDaily ? 'Days' : 'Months'), [showDaily, setXAxisLabel]);

	return (
		<TcZingChart
			modules='fastline'
			{...chartBehaviors}
			data={{
				type: 'fastline',
				crosshairX: Zingchart.CROSSHAIR.SCALE,
				crosshairY: Zingchart.CROSSHAIR.SCALE,
				legend: { visible: enableLegend },
				series: fitSeries,
				scaleX: {
					...genTCScaleX({
						time: false,
						minValue: xConvert(xMin),
						maxValue: xConvert(xMax),
						fontSizeScale,
					}),
				},
				scaleY: genScaleY({ log: yLogScale, minValue: yMin, maxValue: yMax, fontSizeScale }),
			}}
		/>
	);
};

export default ThreePhaseFit;
