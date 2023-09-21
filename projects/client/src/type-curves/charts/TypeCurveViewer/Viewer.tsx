import { faCircle } from '@fortawesome/pro-solid-svg-icons';
import _ from 'lodash-es';
import { useContext, useMemo, useRef, useState } from 'react';

import { Selection } from '@/components/hooks/useSelection';
import { Box, Icon, Paper } from '@/components/v2';
import ForecastChartContainer from '@/forecasts/charts/components/ForecastChartContainer';
import { daysToYears, monthsToYears, yearsToDays, yearsToMonths } from '@/forecasts/charts/components/graphProperties';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { useForecastConvertFunc } from '@/forecasts/manual/shared/conversionHelper';
import { numberWithCommas } from '@/helpers/utilities';
import { CardsLayoutContext } from '@/layouts/CardsLayout';
import { isValidPDict } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/helpers';
import { useTypeCurveNormalization } from '@/type-curves/TypeCurveIndex/normalization/TypeCurveNormalization';
import { FitResolution } from '@/type-curves/TypeCurveIndex/types';
import ViewerTitle from '@/type-curves/charts/TypeCurveViewer/ViewerTitle';
import { ChartContainer, EurSubtitleContainer } from '@/type-curves/charts/TypeCurveViewer/layout';
import { CHART_COLORS } from '@/type-curves/charts/shared';

import {
	LoadingKey,
	LoadingStatuses,
	NormalizationViewerOptions,
	ViewerOptions,
	ViewerType,
	chartViewerTypes,
	normalizationChartViewerTypes,
} from '../graphProperties';
import { useViewerSettings } from './ViewerSettings';
import useRenderView from './useRenderView';

function ViewerRender({ renderView, titleProps, viewerSubtitle, ...chartProps }) {
	return (
		<>
			<ViewerTitle {...titleProps} />
			{viewerSubtitle}
			<ChartContainer>{renderView(chartProps)}</ChartContainer>
		</>
	);
}

function Viewer({
	activeConfig,
	loadingStatuses,
	normalizationProps,
	resolution,
	selection,
	setConfig,
	viewerData,
	viewerOption: parentViewerOption = 'c4',
	viewerType = 'default',
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeConfig?: any;
	loadingStatuses: LoadingStatuses & { configLoading: boolean };
	normalizationProps?: ReturnType<typeof useTypeCurveNormalization>;
	resolution: FitResolution;
	selection: Selection;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setConfig?: (value: any) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	viewerData: any;
	viewerOption: ViewerOptions | NormalizationViewerOptions;
	viewerType?: ViewerType;
}) {
	const [phase, setPhase] = useState<Phase>('oil');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const multipliersTableRef = useRef<{ handleDownload(): void }>({} as any);

	const { maximized, toggleMaximized } = useContext(CardsLayoutContext);
	const cardSymbol = useMemo(() => Symbol('Viewer Chart'), []);

	const chartViewerType = viewerType === 'default' ? chartViewerTypes : normalizationChartViewerTypes;

	const forecastConversions = useForecastConvertFunc({ phase, basePhase: viewerData.basePhase });
	const { eur: eurConversion } = forecastConversions;

	const { viewerOption, setViewerOption, ...settingsProps } = useViewerSettings({
		activeConfig,
		alignAdjustedFitSeries: viewerData?.alignAdjustedFitSeries,
		manualHasSaved: viewerData?.manualHasSaved,
		phase,
		resolution,
		setConfig,
		setPhase,
		uniqueHeaderValueCounts: viewerData.uniqueHeaderValueCounts,
		viewerOption: parentViewerOption,
		viewerType,
	});
	const { chartSettings, setChartSettings } = settingsProps;

	const renderView = useRenderView({
		multipliersTableRef,
		normalizationProps,
		phase,
		selection,
		settingsProps,
		viewerData,
		viewerOption,
		viewerType,
	});

	const titleProps = useMemo(
		() => ({
			maximized,
			multipliersTableRef,
			normRepCount: normalizationProps?.phaseFormProps?.[phase]?.eur.points.length ?? 0,
			phase,
			resolution,
			setPhase,
			settingsProps,
			setViewerOption,
			toggleMaximized: () => toggleMaximized(cardSymbol),
			typeCurveId: viewerData.typeCurveId,
			viewerOption,
			viewerType,
			wellCount:
				viewerOption === 'linearFit' || viewerOption === 'qPeakLinearFit'
					? normalizationProps?.normalizationSelection[phase].filteredArray.length ?? 0
					: viewerData.phaseRepWells[phase].length,
		}),
		[
			cardSymbol,
			maximized,
			normalizationProps?.normalizationSelection,
			normalizationProps?.phaseFormProps,
			phase,
			resolution,
			setViewerOption,
			settingsProps,
			toggleMaximized,
			viewerData.phaseRepWells,
			viewerData.typeCurveId,
			viewerOption,
			viewerType,
		]
	);

	const viewProps = useMemo(
		() => ({
			..._.pick(chartViewerType[viewerOption], [
				'enableXMinMax',
				'enableYMinMax',
				'xMaxItems',
				'xMinItems',
				'yMaxItems',
			]),
		}),
		[chartViewerType, viewerOption]
	);

	const xAxisControlProps = useMemo(() => {
		if (!['c4', 'threePhaseFit', 'fitCum'].includes(viewerOption)) return {};

		const settingsPropKey = viewerOption + 'State';
		const { showDaily = false } = settingsProps[settingsPropKey] ?? {};
		return {
			scaleXControlsToCalc: showDaily ? daysToYears : monthsToYears,
			scaleXControlsToView: showDaily ? yearsToDays : yearsToMonths,
		};
	}, [settingsProps, viewerOption]);

	const viewerSubtitle = useMemo(() => {
		const phaseFitSeries = viewerData.alignAdjustedFitSeries[phase];
		if (viewerOption !== 'c4' || !isValidPDict(phaseFitSeries)) {
			return null;
		}

		const eurs = viewerData.eurs;
		const phaseColors = CHART_COLORS[phase];

		return (
			<EurSubtitleContainer>
				<Box marginRight='0.5rem'>EUR ({eurConversion.viewUnits}) &mdash;</Box>
				{eurs?.[phase] &&
					Object.entries(eurs[phase]).map(([pSeries, eur]) => (
						<Box alignItems='center' display='flex' key={pSeries}>
							<Icon
								css={`
									color: ${phaseColors[`${pSeries}Fit`]};
									margin-right: 0.1rem;
									font-size: 1rem;
								`}
							>
								{faCircle}
							</Icon>

							<div>
								{_.capitalize(pSeries)}:{' '}
								{numberWithCommas(_.round(eurConversion.toView(Number(eur)), 1))}
							</div>
						</Box>
					))}
			</EurSubtitleContainer>
		);
	}, [viewerData.alignAdjustedFitSeries, viewerData.eurs, phase, viewerOption, eurConversion]);

	const isLoading =
		loadingStatuses.configLoading ||
		(chartViewerType?.[viewerOption]?.loadingStatusKeys &&
			Boolean(
				_.find(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					loadingStatuses as any,
					(status: boolean, key: LoadingKey) =>
						chartViewerType[viewerOption].loadingStatusKeys?.includes(key) && status
				)
			));

	return (
		<Paper
			css={`
				${Boolean(maximized) && maximized !== cardSymbol && 'display: none;'}
			`}
		>
			<ForecastChartContainer
				chartSettings={chartSettings}
				isLoading={isLoading}
				render={ViewerRender}
				setChartSettings={setChartSettings}
				{...viewProps}
				{...xAxisControlProps}
				{...{
					renderView,
					titleProps,
					viewerSubtitle,
				}}
			/>
		</Paper>
	);
}

export default Viewer;
