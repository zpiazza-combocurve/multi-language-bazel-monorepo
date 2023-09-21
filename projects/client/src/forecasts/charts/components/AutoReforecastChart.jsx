import produce from 'immer';
import { useEffect, useMemo, useRef } from 'react';

import { PlotZingchart as Zingchart } from '@/components/PlotZingchart';
import { AdditionalChartActionRow, AdditionalChartActions } from '@/forecasts/charts/components/gridChartLayout';
import { getProbXBoundaries, getSelectionMinMax } from '@/forecasts/charts/components/helpers';
import { ForecastPSeries, ProductionSeries, phaseYLabels } from '@/forecasts/charts/config';
import { ProbabilisticDownloadButton } from '@/forecasts/download-forecast/ProbabilisticDownload';
import PhaseStatusButtons from '@/forecasts/shared/PhaseStatusButtons';
import { warningAlert } from '@/helpers/alerts';
import { genLegendConfig, genScaleX, genScaleY } from '@/helpers/zing';

import { ChartTitleText, ProbabilisticChartSubheader } from './ChartTitle';

function AutoReforecastChart({
	auto,
	chartActionsRender,
	chartResolution,
	chartSettings,
	curData,
	curPhase: phase,
	forecastId,
	keyboardTooltipButton,
	lineScatter,
	resolution,
	wellId,
	xLogScale,
}) {
	const zingRef = useRef(null);

	const { yLogScale = true, yMax, yMin, yearsPast = 50, yearsBefore } = chartSettings ?? {};
	const production = curData?.production;

	const subheaderData = useMemo(() => {
		if (auto?.forecasted) {
			return produce(curData.data, (draft) => {
				draft[phase].P_dict = auto.data.P_dict;
			});
		}

		return curData?.data;
	}, [auto, curData, phase]);

	const [xMin, xMax] = useMemo(
		() =>
			getProbXBoundaries({
				production,
				xLogScale,
				yearsBefore,
				yearsPast,
			}),
		[production, xLogScale, yearsBefore, yearsPast]
	);

	const P_dict = auto.forecasted ? auto?.data?.P_dict : curData?.data?.[phase]?.P_dict;
	const forecastType = auto.forecasted ? auto?.data?.forecastType : curData?.data?.[phase]?.forecastType;

	const handleSelection = (event) => {
		const { selectDate } = auto;

		try {
			const [min, max] = getSelectionMinMax(event);
			if (min === null || max === null) {
				throw new Error('Invalid range selected');
			}

			selectDate(new Date(min), new Date(max));
		} catch (error) {
			warningAlert(error.message);
		}
	};

	useEffect(() => {
		zingRef.current?.viewAll();
	}, [xMin, xMax, xLogScale, yLogScale]);

	return (
		<>
			<section className='chart-title-container'>
				{chartActionsRender}

				<span className='title-left'>
					<span className='title-label'>
						<ChartTitleText wellId={curData?._id} />

						<ProbabilisticChartSubheader
							forecasts={subheaderData}
							phase={phase}
							production={production}
							resolution={resolution}
							wellId={curData?._id}
						/>
					</span>
				</span>

				<AdditionalChartActions>
					<AdditionalChartActionRow>
						<ProbabilisticDownloadButton forecastId={forecastId} wellId={wellId} />

						{keyboardTooltipButton}
					</AdditionalChartActionRow>
					<AdditionalChartActionRow>
						<PhaseStatusButtons forecastId={forecastId} wellId={wellId} />
					</AdditionalChartActionRow>
				</AdditionalChartActions>
			</section>

			<section className='chart-content-container'>
				<Zingchart
					data={{
						type: 'mixed',
						scaleY: genScaleY({
							maxValue: yMax > yMin ? yMax : undefined,
							minValue: yMin ?? undefined,
							log: yLogScale,
							yGuide: true,
							yLabel: phaseYLabels[phase],
						}),
						scaleX: genScaleX({
							minValue: xMin,
							maxValue: xMax,
							time: !xLogScale,
							xGuide: true,
							xLabel: false,
							xLogScale,
						}),
						plot: { dataAppendSelection: false },
						plotarea: { marginRight: '35rem' },
						legend: genLegendConfig(),
					}}
					disableContextMenu
					modules='selection-tool'
					events={{
						'zingchart.plugins.selection-tool.beforeselection': (p) => p.ev.altKey,
						'zingchart.plugins.selection-tool.mouseup': handleSelection,
						'zingchart.plugins.selection-tool.selection': () => false,
					}}
					ref={zingRef}
				>
					<ProductionSeries
						index={xLogScale}
						lineScatter={lineScatter}
						phase={phase}
						production={production}
						relative={xLogScale}
						yesarsBefore={yearsBefore}
					/>

					{P_dict && (
						<ForecastPSeries
							chartResolution={chartResolution}
							forecastType={forecastType}
							index={xLogScale}
							names={Object.keys(P_dict)}
							P_dict={P_dict}
							phase={phase}
							production={production}
							relative={xLogScale}
							resolution={resolution}
							yearsBefore={yearsBefore}
							yearsPast={yearsPast}
						/>
					)}
				</Zingchart>
			</section>
		</>
	);
}

export default AutoReforecastChart;
