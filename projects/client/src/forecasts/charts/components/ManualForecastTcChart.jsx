import { MultipleSegments } from '@combocurve/forecast/models';
import { useContext, useEffect, useMemo } from 'react';

import {
	ChartTitleText,
	DeterministicChartSubheader, // ProbabilisticChartSubheader,
} from '@/forecasts/charts/components/ChartTitle';
import {
	DAILY_PRODUCTION_COLORS,
	MONTHLY_PRODUCTION_COLORS,
	VALID_PHASES,
	VALID_RATIOS,
	Y_ITEM_SERIES_TYPES,
} from '@/forecasts/charts/components/graphProperties';
import {
	AdditionalChartActionRow,
	AdditionalChartActions,
	ChartArea,
	ChartAreaContainer,
	ChartTitle,
	ChartTitleInfo,
	VerticalChartActions,
} from '@/forecasts/charts/components/gridChartLayout';
import { dataInit, getProbXBoundaries } from '@/forecasts/charts/components/helpers';
import { visualTimeArr } from '@/forecasts/charts/forecastChartHelper';
import { ProbabilisticDownloadButton } from '@/forecasts/download-forecast/ProbabilisticDownload';
import { ManualEditingTypeCurveContext } from '@/forecasts/manual/ManualEditingTypeCurveContext';
import { useForecastConvertFunc } from '@/forecasts/manual/shared/conversionHelper';
import PhaseStatusButtons from '@/forecasts/shared/PhaseStatusButtons';
import { capitalize } from '@/helpers/text';
import {
	PRIMARY_COLOR,
	convertIdxToMilli,
	forecastSeriesColors,
	genScaleX,
	genScaleY,
	isZingchartZoomed,
	lineSeriesConfig,
	scatterConfig,
	zingDestroy,
	zingDisableContextMenu,
	zingMixed,
	zingModify,
	zingchart,
} from '@/helpers/zing';
import { CardContext } from '@/layouts/CardsLayout';

const multipleSegments = new MultipleSegments();

const generatePDictSeries = ({ pDict, pSeries, type, qConversion, xLogScale }) =>
	Object.entries(pDict).reduce((output, [pKey, segments]) => {
		const config = lineSeriesConfig({
			color: pKey === pSeries ? PRIMARY_COLOR : forecastSeriesColors[pKey],
		});

		const timeArr = segments
			.map((segment) => visualTimeArr(segment, 1, segments[segments.length - 1].end_idx))
			.flat();

		const values = multipleSegments.predict({ idxArr: timeArr, segments });
		return [
			...output,
			{
				...config,
				values: values.map((value, valueIdx) => {
					let parsedValue = value;
					if (type === 'deterministic' && value !== null) {
						parsedValue = qConversion.toView(value);
					}

					return [xLogScale ? timeArr[valueIdx] : convertIdxToMilli(timeArr[valueIdx]), parsedValue];
				}),
				text: capitalize(pKey),
			},
		];
	}, []);

// eslint-disable-next-line complexity
const ManualForecastTcChart = (props) => {
	const {
		chartId = 'manual-type-curve-chart',
		chartSettings,
		forecastId,
		phase,
		production,
		pSeries,
		resolution,
		setYAxisLabel,
		type = 'probabilistic',
		typeProps,
		wellId,
	} = props;

	const { xLogScale, yearsBefore, yearsPast, yLogScale, yMax, yMin } = chartSettings;

	const { tc, typeCurveDict, phaseType } = useContext(ManualEditingTypeCurveContext);
	const { isMaximized, toggleButton } = useContext(CardContext);

	const basePhase = phaseType === 'ratio' && tc?.basePhase && tc.basePhase !== phase ? tc.basePhase : null;

	const forecastConvertFunc = useForecastConvertFunc({
		phase,
		basePhase,
	});

	const { q: qConversion = {}, loaded: forecastConversionLoaded } = forecastConvertFunc;

	const productionSeries = useMemo(() => {
		if (!production) {
			return false;
		}

		const tabularizedData = dataInit(production, [...VALID_PHASES, ...VALID_RATIOS], VALID_PHASES);
		const { time } = tabularizedData;

		const isMonthly = resolution === 'monthly';
		const color = (isMonthly ? MONTHLY_PRODUCTION_COLORS : DAILY_PRODUCTION_COLORS)[phase];
		const { type: seriesType, props: yItemProps } = Y_ITEM_SERIES_TYPES[resolution].production;

		const seriesTypeProps = seriesType({ color, ...yItemProps });
		if (phaseType === 'rate') {
			return {
				...seriesTypeProps,
				text: `${capitalize(resolution)} ${capitalize(phase)}`,
				values: tabularizedData[phase].map((value, idx) => [time[idx], qConversion.toView(value)]),
			};
		}
		if (basePhase) {
			return {
				...seriesTypeProps,
				text: `${capitalize(resolution)} ${capitalize(phase)}/${capitalize(basePhase)}`,
				values: tabularizedData[`${phase}/${basePhase}`].map((value, idx) => [
					time[idx],
					qConversion.toView(value),
				]),
			};
		}

		return false;
	}, [basePhase, phase, phaseType, production, qConversion, resolution]);

	const forecastSeries = useMemo(() => {
		let phaseData;
		if (typeCurveDict) {
			return [];
		}

		if (type === 'deterministic' && typeProps?.wellData) {
			phaseData = typeProps.wellData?.forecast?.[phase];
		}
		if (type === 'probabilistic' && typeProps?.curData) {
			phaseData = typeProps.curData?.data?.[phase];
		}

		if (phaseData) {
			const { P_dict } = phaseData;
			const pDict = Object.entries(P_dict).reduce(
				(obj, [key, value]) => ({ ...obj, [key]: value?.segments ?? [] }),
				{}
			);
			return generatePDictSeries({ pDict, qConversion, type, xLogScale });
		}

		return [];
	}, [phase, qConversion, type, typeCurveDict, typeProps, xLogScale]);

	const typeCurveSeries = useMemo(() => {
		if (typeCurveDict && forecastConversionLoaded) {
			return generatePDictSeries({ pDict: typeCurveDict, pSeries, qConversion, type, xLogScale });
		}

		return [];
	}, [forecastConversionLoaded, pSeries, qConversion, type, typeCurveDict, xLogScale]);

	useEffect(() => {
		const config = scatterConfig({
			crosshairX: true,
			crosshairY: true,
			log: true,
			showGUIbtn: false,
			zoomOutConfig: {
				labelConfig: {
					offsetX: -250,
				},
			},
			plotarea: { marginRight: '40rem' },
		});

		config.scaleY.minValue = undefined;
		config.series = [];

		zingMixed(chartId, config);
		zingDisableContextMenu(chartId);

		return () => {
			zingDestroy(chartId);
		};
	}, [chartId]);

	useEffect(() => {
		if (isZingchartZoomed(chartId)) {
			zingchart.exec(chartId, 'viewall', { update: false });
		}
	}, [chartId, yearsBefore, yearsPast, yMin, yMax]);

	// onChartSettingsUpdate
	useEffect(() => {
		const [xMin, xMax] = getProbXBoundaries({
			production,
			yearsBefore,
			yearsPast,
			xLogScale,
		});

		const scaleX = genScaleX({
			maxValue: xMax,
			minValue: xMin,
			time: !xLogScale,
			xGuide: true,
			xLabel: false,
			xLogScale,
		});

		const scaleY = genScaleY({
			maxValue: yMax > yMin ? yMax : undefined,
			minValue: yMin ?? undefined,
			log: yLogScale,
			yGuide: true,
			yLabel: false,
		});

		zingModify(chartId, { scaleY, scaleX });
	}, [chartId, production, type, xLogScale, yLogScale, yMax, yMin, yearsBefore, yearsPast]);

	useEffect(() => {
		setYAxisLabel(qConversion.viewUnits);
	}, [qConversion.viewUnits, setYAxisLabel]);

	useEffect(() => {
		zingModify(chartId, { series: [productionSeries, ...typeCurveSeries, ...forecastSeries].filter(Boolean) });
	}, [chartId, typeCurveSeries, productionSeries, forecastSeries]);

	return (
		<>
			<ChartTitle disablePadding={!isMaximized}>
				{type === 'probabilistic' && typeProps?.chartActionsRender}

				{(type === 'probabilistic' || (isMaximized && type === 'deterministic')) && (
					<ChartTitleInfo>
						<ChartTitleText wellId={wellId} />

						{type === 'deterministic' && typeProps?.wellData && (
							<DeterministicChartSubheader
								dailyProduction={typeProps.wellData.daily}
								forecasts={typeProps.wellData.forecast}
								monthlyProduction={typeProps.wellData.monthly}
								wellId={wellId}
							/>
						)}

						{/* need to find a way to incorporate this */}
						{/* {type === 'probabilistic' && typeProps?.curData && (
						<ProbabilisticChartSubheader
							forecasts={typeProps.curData?.data}
							manualPhase={phase}
							manualSeries={typeCurveDict?.[pSeries] ?? []}
							phase={phase}
							production={typeProps.curData?.production}
							resolution={resolution}
							wellId={wellId}
						/>
					)} */}
					</ChartTitleInfo>
				)}

				{type === 'probabilistic' && (
					<AdditionalChartActions>
						<AdditionalChartActionRow>
							<ProbabilisticDownloadButton forecastId={forecastId} wellId={wellId} />
						</AdditionalChartActionRow>
						<AdditionalChartActionRow>
							<PhaseStatusButtons forecastId={forecastId} wellId={wellId} />
						</AdditionalChartActionRow>
					</AdditionalChartActions>
				)}
			</ChartTitle>

			<ChartAreaContainer>
				<ChartArea id={chartId} tabIndex='-1' />

				{type === 'deterministic' && <VerticalChartActions>{toggleButton}</VerticalChartActions>}
			</ChartAreaContainer>
		</>
	);
};

export default ManualForecastTcChart;
