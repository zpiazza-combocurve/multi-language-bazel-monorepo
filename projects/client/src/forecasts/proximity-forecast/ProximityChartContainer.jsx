import classNames from 'classnames';
import produce from 'immer';
import { isObject, set } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { useMergedState } from '@/components/hooks';
import ForecastChartContainer from '@/forecasts/charts/components/ForecastChartContainer';
import { daysToYears, monthsToYears, yearsToDays, yearsToMonths } from '@/forecasts/charts/components/graphProperties';
import { local } from '@/helpers/storage';
import { Card } from '@/layouts/CardsLayout';
import { LinearFitChart } from '@/type-curves/TypeCurveNormalization/LinearFitChart';
import FitChartViewer from '@/type-curves/charts/FitChartViewer';
import { DEFAULT_DAILY, proximityChartViewerTypes } from '@/type-curves/charts/graphProperties';
import SelectionActions from '@/type-curves/shared/SelectionActions';

const INIT_VIEWER_KEYS = ['c4', 'map'];

const DEFAULT_GRID_CHART_SELECTION = INIT_VIEWER_KEYS.reduce(
	(obj, key, idx) => ({ ...obj, [`chart-${idx}`]: key }),
	{}
);

const GRID_STORAGE_KEY = 'proximityGridChartSelection';

const excludedChartKeys = ['cum', 'sum', 'fitCum', 'ip', 'crossplot', 'rateVsCum'];

const GridContainer = styled.div`
	display: grid;
	gap: ${({ chartMaximized }) => (chartMaximized ? '0' : '0.75rem')};
	grid-template-columns: 100%;
	grid-template-rows: ${({ chartMaximized }) => (chartMaximized ? '100%;' : 'calc(50% - .5rem) calc(50% - .5rem)')};
	height: 100%;
	width: 100%;
	overflow: auto;
`;

const ProximityChartContainer = ({ isMinimized, chartMaximized, fitProps, normalizationProps }) => {
	const [gridChartSelection, setGridChartSelection] = useMergedState({
		...(local.getItem(GRID_STORAGE_KEY) ?? DEFAULT_GRID_CHART_SELECTION),
	});

	useEffect(() => {
		local.setItem(GRID_STORAGE_KEY, gridChartSelection);
	}, [gridChartSelection]);

	const [viewerId, viewerKey] = Object.entries(gridChartSelection)[0];
	const [viewer2Id, viewer2Key] = Object.entries(gridChartSelection)[1];

	const {
		defaultChartSettings = {},
		enableXMinMax,
		enableYMinMax,
		yMaxItems,
		xMinItems,
		xMaxItems,
	} = proximityChartViewerTypes[viewerKey] ?? {};

	const {
		defaultChartSettings: defaultChartSettings2 = {},
		enableXMinMax: enableXMinMax2,
		enableYMinMax: enableYMinMax2,
		yMaxItems: yMaxItems2,
		xMinItems: xMinItems2,
		xMaxItems: xMaxItems2,
	} = proximityChartViewerTypes[viewer2Key] ?? {};

	const {
		align,
		alignMonthlyTargetPhaseData,
		alignAdjustedFitSeries,
		basePhase,
		basePhaseSeries,
		baseSegments,
		calculatedBackgroundData,
		cumData,
		eurData,
		eurs,
		fit,
		fitSeries,
		getShiftBaseSegments,
		headersMap,
		noalignMonthlyTargetProdData,
		normalize,
		noWells,
		phase,
		phaseType,
		prodData,
		proximityProps,
		resolution,
		selection,
		selectionFilterTo,
		selectionFilterOut,
		tcFits,
		tcId,
	} = fitProps;

	const { phase: normPhase } = normalizationProps;
	const { points, aValue, bValue, base, targetX, type } = normalizationProps.phaseFormProps[normPhase].eur;

	const fitLoaded = isObject(fitSeries) && Object.keys(fitSeries).length;

	const [c4ShowDaily, setC4ShowDaily] = useState(DEFAULT_DAILY);

	const paramsTablePhaseFits = useMemo(() => {
		const tcFitsTemplate = { oil: null, gas: null, water: null };
		return produce(tcFitsTemplate, (draft) => {
			if (fitSeries) {
				draft[phase] = { align, fitType: phaseType, normalize, resolution, basePhase };
				const { fitType } = draft[phase];
				if (fitType === 'ratio') {
					set(draft, `${phase}.ratio_P_dict`, fitSeries);
					set(draft, `${phase}.basePhase`, basePhase);
				} else {
					set(draft, `${phase}.P_dict`, fitSeries);
				}
			}
		});
	}, [align, basePhase, fitSeries, normalize, phase, phaseType, resolution]);

	const linearFitChartProps = useMemo(
		() => ({
			phase: normPhase,
			points,
			aValue,
			bValue,
			base,
			targetX,
			type,
		}),
		[normPhase, points, aValue, bValue, base, targetX, type]
	);

	const linearFitChart = useCallback(
		({ eurMap, headersMap, ...props }) => {
			return (
				<LinearFitChart
					eurQuery={{ data: eurMap }}
					headersQuery={{ data: headersMap }}
					{...props}
					{...linearFitChartProps}
					noHeader
					css='width: 100%; height: 100%; display: flex;'
				/>
			);
		},
		[linearFitChartProps]
	);

	const extendedCharts = useMemo(
		() => [
			{
				key: 'linearFit',
				label: 'Normalization Chart',
				component: linearFitChart,
			},
		],
		[linearFitChart]
	);

	const chartProps = useMemo(
		() => ({
			align,
			alignAdjustedFitSeries,
			alignMonthlyTargetPhaseData,
			basePhase,
			basePhaseFit: tcFits?.[basePhase]?.P_dict,
			basePhaseSeries,
			baseSegments,
			c4: calculatedBackgroundData,
			calculatedBackgroundData,
			cumData,
			curPhase: phase,
			eurData,
			eurs,
			getShiftBaseSegments,
			noalignMonthlyTargetProdData,
			normalize,
			noWells,
			phaseType,
			prodData,
			proximityRadius: proximityProps.proximityRadius,
			proximityWell: proximityProps.wellId,
			wellIds: selection.filteredArray ?? [],
		}),
		[
			align,
			alignAdjustedFitSeries,
			alignMonthlyTargetPhaseData,
			basePhase,
			tcFits,
			basePhaseSeries,
			baseSegments,
			calculatedBackgroundData,
			cumData,
			phase,
			eurData,
			eurs,
			getShiftBaseSegments,
			noalignMonthlyTargetProdData,
			normalize,
			noWells,
			phaseType,
			prodData,
			proximityProps.proximityRadius,
			proximityProps.wellId,
			selection.filteredArray,
		]
	);

	const sharedRenderProps = useMemo(
		() => ({
			c4ShowDaily,
			chartProps,
			disableConfigurations: true,
			eurMap: proximityProps.repInitWellsMap,
			excludedChartKeys,
			extendedCharts,
			fitAlign: fit?.align,
			fitLoaded,
			fitProps,
			fitSeries,
			headersMap,
			proximityProps,
			render: FitChartViewer,
			selection,
			setC4ShowDaily,
			tcId,
			wellCount: chartProps.wellIds?.length ?? 0,
			wellIds: chartProps.wellIds,
			paramsTablePhaseFits,
		}),
		[
			c4ShowDaily,
			chartProps,
			proximityProps,
			extendedCharts,
			fit?.align,
			fitLoaded,
			fitProps,
			fitSeries,
			headersMap,
			selection,
			tcId,
			paramsTablePhaseFits,
		]
	);

	const scaleProps = useMemo(
		() => ({
			scaleXControlsToCalc: c4ShowDaily ? daysToYears : monthsToYears,
			scaleXControlsToView: c4ShowDaily ? yearsToDays : yearsToMonths,
			setShowDaily: setC4ShowDaily,
			showDaily: c4ShowDaily,
		}),
		[c4ShowDaily]
	);

	return (
		<div
			css={`
				display: flex;
				flex-direction: column;
				height: 100%;
				padding: ${chartMaximized ? '0' : '0.5rem 0.75rem 0.5rem 0;'};
				row-gap: 0.5rem;
				width: 100%;
			`}
		>
			<div css='display: flex'>
				<SelectionActions
					buttonSize='small'
					clearCurrentActive
					labelFilterOut='Exclude'
					labelFilterTo='Include'
					onFilterOut={() => selectionFilterOut()}
					onFilterTo={() => selectionFilterTo()}
					selection={selection}
				/>
			</div>

			<GridContainer chartMaximized={chartMaximized}>
				<Card key={viewerId} disableHeader noPadding disableOverflow>
					<ForecastChartContainer
						className={classNames('chart-container', 'chart-area__section', 'paper-1-to-paper-4')}
						chartKey={viewerKey}
						chartSettings={defaultChartSettings}
						enableXMinMax={enableXMinMax ?? false}
						enableYMinMax={enableYMinMax ?? false}
						setChartKey={(input) => setGridChartSelection({ [viewerId]: input })}
						viewerName={`fit-chart-viewer-${viewerId}`}
						xMaxItems={xMaxItems}
						xMinItems={xMinItems}
						yMaxItems={yMaxItems}
						{...sharedRenderProps}
						{...(viewerKey === 'c4' && scaleProps)}
					/>
				</Card>

				{!isMinimized && (
					<Card key={viewer2Id} disableHeader noPadding disableOverflow>
						<ForecastChartContainer
							css={`
								${isMinimized && 'display: none'};
							`}
							className={classNames('chart-container', 'chart-area__section', 'paper-1-to-paper-4')}
							chartKey={viewer2Key}
							chartSettings={defaultChartSettings2}
							enableXMinMax={enableXMinMax2 ?? false}
							enableYMinMax={enableYMinMax2 ?? false}
							fitAlign={fit?.align}
							setChartKey={(input) => setGridChartSelection({ [viewer2Id]: input })}
							viewerName={`fit-chart-viewer-${viewer2Id}`}
							xMaxItems={xMaxItems2}
							xMinItems={xMinItems2}
							yMaxItems={yMaxItems2}
							{...sharedRenderProps}
							{...(viewer2Key === 'c4' && scaleProps)}
						/>
					</Card>
				)}
			</GridContainer>
		</div>
	);
};

export default ProximityChartContainer;
