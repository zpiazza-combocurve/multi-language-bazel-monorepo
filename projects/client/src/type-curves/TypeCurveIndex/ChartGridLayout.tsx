import { faChevronDown, faTimes, faUndo, faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { useTheme } from '@material-ui/core';
import produce from 'immer';
import { memo, useCallback, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import styled, { withTheme } from 'styled-components';

import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { Selection } from '@/components/hooks/useSelection';
import { Button, Divider, IconButton, InfoTooltipWrapper, MenuButton, RadioItem } from '@/components/v2';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import { ForecastType, Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { scrollBarStyles } from '@/forecasts/forecast-form/phase-form/layout';
import { useKeyboardTooltipFloater } from '@/forecasts/manual/shared';
import { ManualSpeedMenuBtn } from '@/forecasts/shared';
import { ForecastFloaterButton } from '@/forecasts/shared/ForecastFloater';
import ForecastParameters from '@/forecasts/shared/ForecastParameters';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';
import { putApi } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import { CardsLayout } from '@/layouts/CardsLayout';
import Viewer from '@/type-curves/charts/TypeCurveViewer/Viewer';
import { WellFilterButton } from '@/well-filter/WellFilterButton';

import { useTypeCurveSettings } from '../TypeCurveSettings';
import { TC_KEYS, useTypeCurve } from '../api';
import ManualFitChart from '../charts/ManualFitChart';
import { INIT_VIEWER_KEYS, LoadingStatuses } from '../charts/graphProperties';
import ExcludeActions from '../shared/ExcludeActions';
import FitDownloadButton from '../shared/fit-tc/FitDownloadButton';
import { WELL_VALIDATION_OPTIONS } from '../shared/formProperties';
import { ChartGridAreaContainer, ChartGridContainer, ChartGridToolbarContainer } from './layout';
import { useTypeCurveManual } from './manual/TypeCurveManual';
import { useTypeCurveNormalization } from './normalization/TypeCurveNormalization';
import { FitResolution, Mode } from './types';

const NUMBER_OF_CHARTS = 4;

const EMPTY_CONFIGURATION = {
	viewer0: {},
	viewer1: {},
	viewer2: {},
	viewer3: {},
};

const StyledTextItem = withTheme(styled.div`
	background-color: ${({ theme }) => theme.palette.secondary.dark};
	color: ${({ theme }) => theme.palette.secondary.contrastText};
	display: flex;
	font-size: 1rem;
	font-weight: 500;
	justify-content: center;
	line-height: 2.5rem;
	width: 100%;
`);

function ChartGridLayout({
	allWellIds,
	collapsed,
	handleOnQuickWellFilter,
	handleWellFilter,
	loadingStatuses: _loadingStatuses,
	manualProps,
	mode,
	normalizationProps,
	parametersProps,
	resetWellFilter,
	resolution,
	selection,
	typeCurveId,
	viewerData,
	wellFilterActive,
}: {
	allWellIds: Array<string>;
	collapsed?: boolean;
	handleOnQuickWellFilter: (values) => void;
	handleWellFilter: () => void;
	loadingStatuses: LoadingStatuses;
	manualProps?: ReturnType<typeof useTypeCurveManual>;
	mode: Mode;
	normalizationProps?: ReturnType<typeof useTypeCurveNormalization>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	parametersProps: any;
	resetWellFilter: () => void;
	resolution: FitResolution;
	selection: Selection;
	typeCurveId: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	viewerData: Record<string, any>;
	wellFilterActive: boolean;
}) {
	const {
		activeConfig,
		activeConfigKey,
		dialog: chartConfigurationDialog,
		showConfigDialog,
	} = useConfigurationDialog({
		key: 'tcChartGrid',
		title: 'Chart Configurations',
		enableSharedConfigs: true,
	});

	const loadingStatuses = useMemo(() => {
		const configLoading = activeConfigKey === '' && !!activeConfig && Object.keys(activeConfig).length === 0;
		return { ..._loadingStatuses, configLoading };
	}, [_loadingStatuses, activeConfig, activeConfigKey]);

	const [phase, setPhase] = useState<Phase>('oil');
	const [toSaveConfig, _setToSaveConfig] = useDerivedState(activeConfigKey ? activeConfig : EMPTY_CONFIGURATION);

	const { keyboardTooltipButton, keyboardTooltipFloater } = useKeyboardTooltipFloater({
		mode: 'typeCurveManual',
	});

	const theme = useTheme();
	const { data: typeCurve } = useTypeCurve(typeCurveId);
	const { updateAdditionalSettings } = useTypeCurveSettings(typeCurveId);

	const { phase: manualPhase = 'oil', speedState, setSpeedState } = manualProps ?? {};

	const setToSaveConfig = useCallbackRef(({ viewerKey, config }) => {
		_setToSaveConfig(
			produce((draft) => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				draft![viewerKey] = config;
			})
		);
	});

	const individualChartSettings = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const { viewer0, viewer1, viewer2, viewer3 } = toSaveConfig as any;
		const [viewer0Type, viewer1Type, viewer2Type, viewer3Type] = [
			viewer0?.viewerOption,
			viewer1?.viewerOption,
			viewer2?.viewerOption,
			viewer3?.viewerOption,
		];

		const configStateMap = {
			c4: 'c4State',
			crossplot: 'crossPlotState',
			fitCum: 'fitCumState',
			probit: 'probitState',
			rateVsCum: 'rateVsCumState',
		};

		const individualChartSettings = {
			chart0: {
				activeChartSeries: viewer0?.activeChartSeries,
				chartSettings: viewer0?.chartSettings,
				phase: viewer0?.phase,
				chartType: viewer0Type,
				...(configStateMap[viewer0Type] && viewer0[configStateMap[viewer0Type]]),
			},
			chart1: {
				activeChartSeries: viewer1?.activeChartSeries,
				chartSettings: viewer1?.chartSettings,
				phase: viewer1?.phase,
				chartType: viewer1Type,
				...(configStateMap[viewer1Type] && viewer1[configStateMap[viewer1Type]]),
			},
			chart2: {
				activeChartSeries: viewer2?.activeChartSeries,
				chartSettings: viewer2?.chartSettings,
				phase: viewer2?.phase,
				chartType: viewer2Type,
				...(configStateMap[viewer2Type] && viewer2[configStateMap[viewer2Type]]),
			},
			chart3: {
				activeChartSeries: viewer3?.activeChartSeries,
				chartSettings: viewer3?.chartSettings,
				phase: viewer3?.phase,
				chartType: viewer3Type,
				...(configStateMap[viewer3Type] && viewer3[configStateMap[viewer3Type]]),
			},
		};

		return individualChartSettings;
	}, [toSaveConfig]);

	const renderParametersProps = useMemo(() => {
		const { basePhase, eurs, fitSeries, phaseTypes, tcFits } = parametersProps;
		return {
			basePhase,
			baseSegments: tcFits?.[basePhase]?.best?.segments ?? [],
			forecastType: phaseTypes[phase],
			idxDate: true,
			passedEurs: eurs,
			pDict: fitSeries[phase],
			phase,
			setPhase,
			type: 'probabilistic' as ForecastType,
			phaseTypes,
		};
	}, [parametersProps, phase]);

	const { mutateAsync: updateTcWellValidationCriteria, isLoading: updatingCriteria } = useMutation(async (val) => {
		assert(typeCurve);

		const { basePhase, forecastSeries, phaseType, tcType, resolutionPreference } = typeCurve;
		await updateAdditionalSettings({
			basePhase,
			forecastSeries,
			phaseType,
			tcType,
			resolutionPreference,
			wellValidationCriteria: val,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		} as any);

		await Promise.all([
			queryClient.refetchQueries(TC_KEYS.view(typeCurveId), { exact: true }),
			queryClient.refetchQueries(TC_KEYS.wellsValidation(typeCurveId), { exact: true }),
		]);
	});

	const chartAreaRender = useMemo(() => {
		const retRender: Array<JSX.Element> = [];
		const viewerProps = {
			loadingStatuses,
			selection,
			viewerData,
			resolution,
		};

		// normalization render
		if (mode === 'normalization') {
			for (let i = 0; i < NUMBER_OF_CHARTS - 2; i++) {
				const viewerKey = `viewer${i}`;
				retRender.push(
					<Viewer
						key={`tc-viewer-chart-${i}`}
						activeConfig={activeConfig?.[viewerKey]}
						setConfig={(config) => setToSaveConfig({ viewerKey, config })}
						viewerOption={activeConfig?.[viewerKey]?.viewerOption ?? INIT_VIEWER_KEYS[i]}
						{...viewerProps}
					/>
				);
			}

			retRender.push(
				<Viewer
					key='tc-viewer-chart-2'
					normalizationProps={normalizationProps}
					viewerOption='linearFit'
					viewerType='normalization'
					{...viewerProps}
				/>
			);
			retRender.push(
				<Viewer
					key='tc-viewer-chart-3'
					normalizationProps={normalizationProps}
					viewerOption='normalizationMultipliersTable'
					viewerType='normalization'
					{...viewerProps}
				/>
			);

			return retRender;
		}

		// table and fit renders
		if (mode !== 'manual') {
			for (let i = 0; i < NUMBER_OF_CHARTS; i++) {
				const viewerKey = `viewer${i}`;
				retRender.push(
					<Viewer
						key={`tc-viewer-chart-${i}`}
						activeConfig={activeConfig?.[viewerKey]}
						setConfig={(config) => setToSaveConfig({ viewerKey, config })}
						viewerOption={activeConfig?.[viewerKey]?.viewerOption ?? INIT_VIEWER_KEYS[i]}
						{...viewerProps}
					/>
				);
			}
			return retRender;
		}

		// manual render
		const { align, basePhase, calculatedBackgroundData, fitSeries, phaseRepWells, phaseTypes, phaseData } =
			viewerData;
		return (
			<ManualFitChart
				{...{
					align,
					basePhase,
					bKey: manualProps?.bKey,
					calculatedBackgroundData: calculatedBackgroundData[manualPhase],
					fitSeries: fitSeries[manualPhase],
					keyboardTooltipButton: null,
					noWells: !phaseRepWells?.[manualPhase]?.length,
					phase: manualPhase,
					phaseType: phaseTypes[manualPhase],
					prodData: phaseData?.[manualPhase]?.prodData,
					resolution,
				}}
			/>
		);
	}, [
		activeConfig,
		loadingStatuses,
		manualPhase,
		manualProps?.bKey,
		mode,
		normalizationProps,
		resolution,
		selection,
		setToSaveConfig,
		viewerData,
	]);

	const addWellsToEditing = useCallback(async () => {
		if (!typeCurve?.forecast) return;
		try {
			const wellIds = [...selection.selectedSet];
			await putApi(`/forecast/${typeCurve.forecast}/add-to-manual`, {
				wellIds,
			});
			confirmationAlert('Successfully added wells to Editing!');
		} catch (error) {
			genericErrorAlert(error);
		}
	}, [typeCurve?.forecast, selection.selectedSet]);

	const handleSelectionReset = () => {
		selection.deselectAll();
	};

	return (
		<ChartGridContainer collapsed={collapsed}>
			{chartConfigurationDialog}
			{keyboardTooltipFloater}

			<ChartGridToolbarContainer>
				<div
					css={`
						align-items: center;
						column-gap: 0.5rem;
						display: flex;
					`}
				>
					<ForecastToolbarTheme>
						{mode !== 'manual' ? (
							<>
								<WellFilterButton
									onFilterWells={handleWellFilter}
									onQuickFilter={handleOnQuickWellFilter}
									small
									wellIds={allWellIds}
								/>

								{wellFilterActive && (
									<IconButton onClick={resetWellFilter} size='small' tooltipTitle='Clear Well Filter'>
										{faUndo}
									</IconButton>
								)}

								<Divider orientation='vertical' flexItem />

								{!collapsed && (
									<MenuButton
										label={
											<InfoTooltipWrapper tooltipTitle='Identify data requirements for representative wells. Selection will impact number of valid wells.'>
												Rep Data Requirement
											</InfoTooltipWrapper>
										}
										endIcon={faChevronDown}
										hideMenuOnClick
									>
										<StyledTextItem>Each Well Must Have:</StyledTextItem>

										{WELL_VALIDATION_OPTIONS.map((item) => (
											<RadioItem
												key={item.value}
												disabled={updatingCriteria}
												label={item.label}
												// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
												onChange={() => updateTcWellValidationCriteria(item.value as any)}
												value={item.value === typeCurve?.wellValidationCriteria}
											/>
										))}
									</MenuButton>
								)}

								<Divider orientation='vertical' flexItem />

								<ExcludeActions typeCurveId={typeCurveId} selection={selection} />
							</>
						) : (
							<ManualSpeedMenuBtn
								endIcon={faChevronDown}
								speedState={speedState}
								// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
								setSpeedState={setSpeedState as any}
							/>
						)}
					</ForecastToolbarTheme>
				</div>

				<div
					css={`
						align-items: center;
						column-gap: 0.5rem;
						display: flex;
						justify-self: flex-end;
					`}
				>
					{!collapsed && (
						<ForecastToolbarTheme>
							{!!selection.selectedSet.size && (
								<IconButton tooltipTitle='Reset' onClick={handleSelectionReset} color='secondary'>
									{faTimes}
								</IconButton>
							)}
							<Button
								variant='outlined'
								color='secondary'
								onClick={addWellsToEditing}
								disabled={!selection.selectedSet.size && 'Select wells to add to editing'}
							>
								Add Wells to Editing
							</Button>
						</ForecastToolbarTheme>
					)}
					{mode !== 'manual' && (
						<ForecastFloaterButton color='default' useHandle>
							<ForecastParameters {...renderParametersProps} useHandle />
						</ForecastFloaterButton>
					)}
					{['view', 'fit'].includes(mode) && (
						<>
							<FitDownloadButton
								individualChartSettings={individualChartSettings}
								typeCurveId={typeCurveId}
								resolution={resolution}
							/>

							<IconButton
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
								onClick={() => showConfigDialog(toSaveConfig!)}
								size='small'
								tooltipTitle='Chart Configurations'
							>
								{faUserCog}
							</IconButton>
						</>
					)}

					{mode === 'manual' && keyboardTooltipButton}
				</div>
			</ChartGridToolbarContainer>

			<ChartGridAreaContainer>
				<CardsLayout
					css={scrollBarStyles({ theme, width: '10px' })}
					elementsPerRow={mode === 'manual' || collapsed ? 1 : 2}
				>
					{chartAreaRender}
				</CardsLayout>
			</ChartGridAreaContainer>
		</ChartGridContainer>
	);
}

export default memo(ChartGridLayout);
