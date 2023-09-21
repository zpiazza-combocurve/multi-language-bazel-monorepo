import { MultipleSegments } from '@combocurve/forecast/models';
import { faChevronDoubleLeft, faChevronDoubleRight } from '@fortawesome/pro-regular-svg-icons';
import { ToggleButtonGroup } from '@material-ui/lab';
import _ from 'lodash-es';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';

import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { Divider, IconButton, InfoTooltipWrapper, SwitchField, Tab, Tabs } from '@/components/v2';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { showUnsavedWorkDialog } from '@/helpers/unsaved-work';
import { forecastSeries, phases } from '@/helpers/zing';
import { useSelectedByWellFilter } from '@/well-filter/hooks';

import { getInitToggleState, isValidPDict } from '../TypeCurveFit/TypeCurveControls/shared/helpers';
import { EurResult } from '../api';
import { LoadingStatuses } from '../charts/graphProperties';
import { shiftNonMatchingSegments } from '../charts/shared';
import { getPhaseData } from '../shared/fit-tc/daily-helpers';
import { useTypeCurveInfo } from '../shared/useTypeCurveInfo';
import { TypeCurveWellHeaders } from '../types';
import ChartGridLayout from './ChartGridLayout';
import ControlsLayout from './ControlsLayout';
import { useTypeCurveFit } from './fit/TypeCurveFit';
import { getSeriesInfo, getShiftBaseSegments } from './fit/helpers';
import { ControlsContainer, FitToggleButton, ModeLayoutContainer } from './layout';
import { useTypeCurveManual } from './manual/TypeCurveManual';
import { useTypeCurveNormalization } from './normalization/TypeCurveNormalization';
import useViewerFilteredWells from './shared/useViewerFilteredWells';
import {
	Align,
	CalculatedBackgroundDataType,
	FitInitType,
	FitPhaseTypes,
	FitResolution,
	Mode,
	RawBackgroundDataType,
} from './types';

const multiSeg = new MultipleSegments();

const modes: Array<{
	label: string;
	value: Mode;
}> = [
	{ label: 'Table', value: 'view' },
	{ label: 'Normalization', value: 'normalization' },
	{ label: 'Fit', value: 'fit' },
	{ label: 'Manual', value: 'manual' },
];

const getNormalizationArr = ({ multipliersMap, phase, wells }) => {
	if (!wells) {
		return [];
	}

	const phaseMultiplierMap = multipliersMap?.[phase] ?? {};
	return _.map(wells, (wellId) => phaseMultiplierMap?.[wellId] ?? [1, 1]);
};

function ModeLayout({
	activeFitConfig,
	allWellIds,
	defaultFitConfig,
	eurMap,
	fitConfigProps,
	fitInit,
	handleOnQuickWellFilter,
	handleWellFilter,
	headersMap,
	loadingStatuses,
	mode,
	phaseExcludedWells,
	phaseRepWells,
	rawBackgroundData,
	resetTcFits,
	resetWellFilter,
	resolution,
	setMode,
	setResolution,
	setTcFits,
	tcFits,
	tcFitsQueryData,
	typeCurveId,
	wellFilterActive,
	wellFilterWells,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeFitConfig?: any;
	allWellIds: Array<string>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	defaultFitConfig?: any;
	eurMap: EurResult;
	fitConfigProps: ReturnType<typeof useConfigurationDialog>;
	fitInit: FitInitType;
	handleOnQuickWellFilter: (value) => void;
	handleWellFilter: () => void;
	headersMap: Map<string, TypeCurveWellHeaders>;
	initAlign?: Align;
	initNormalize?: boolean;
	loadingStatuses: LoadingStatuses;
	mode: Mode;
	phaseExcludedWells: Record<Phase, Array<string>>;
	phaseRepWells: Record<Phase, Array<string>>;
	rawBackgroundData: Record<Phase, RawBackgroundDataType>;
	resetTcFits: () => void;
	resetWellFilter: () => void;
	resolution: FitResolution;
	setMode: Dispatch<SetStateAction<Mode>>;
	setResolution: Dispatch<SetStateAction<FitResolution>>;
	setTcFits: (value) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	tcFits: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	tcFitsQueryData: any;
	typeCurveId: string;
	wellFilterActive: boolean;
	wellFilterWells: Array<string> | null;
}) {
	// shared state between forms and charts
	const [align, setAlign] = useDerivedState<Align>(
		(curValue) =>
			getInitToggleState({
				activeConfig: activeFitConfig,
				curValue,
				defaultConfig: defaultFitConfig,
				savedFit: tcFitsQueryData,
				key: 'align',
			}),
		[activeFitConfig, defaultFitConfig, Boolean(_.keys(tcFitsQueryData).length)]
	);

	const [expanded, setExpanded] = useState<boolean>(false);
	const [manualHasSaved, setManualHasSaved] = useState(false);

	const [normalize, setNormalize] = useDerivedState<boolean>(
		(curValue) =>
			getInitToggleState({
				activeConfig: activeFitConfig,
				curValue,
				defaultConfig: defaultFitConfig,
				savedFit: tcFitsQueryData,
				key: 'normalize',
			}),
		[activeFitConfig, defaultFitConfig, Boolean(_.keys(tcFitsQueryData).length)]
	);

	const { wellIds } = useTypeCurveInfo(typeCurveId);
	const { selection } = useSelectedByWellFilter(wellIds);

	const toggleAlign = () => setAlign((p) => (p === 'align' ? 'noalign' : 'align'));
	const toggleNormalize = () => setNormalize((p) => !p);

	const fitPhaseType: FitPhaseTypes = fitInit.phaseType;
	const basePhase: Phase = fitInit.basePhase;

	const normalizationProps = useTypeCurveNormalization({
		basePhase,
		phaseRepWells,
		phaseTypes: fitPhaseType,
		typeCurveId,
	});
	const { multipliersMap, eurAndQPeakMultipliers } = normalizationProps;

	// processing for normalization which should be controlled front-end
	const _calculatedBackgroundData = useMemo(
		() =>
			loadingStatuses?.fitInitIsLoading || loadingStatuses?.rawBackgroundIsLoading || normalizationProps.loading
				? { oil: null, gas: null, water: null }
				: _.mapValues(rawBackgroundData, (values, phase) => ({
						...(values ?? {}),
						normalization: getNormalizationArr({
							multipliersMap,
							phase,
							wells: values?.wells,
						}),
						multipliers: eurAndQPeakMultipliers[phase],
				  })),
		[
			eurAndQPeakMultipliers,
			loadingStatuses?.fitInitIsLoading,
			loadingStatuses?.rawBackgroundIsLoading,
			multipliersMap,
			normalizationProps.loading,
			rawBackgroundData,
		]
	) as Record<Phase, CalculatedBackgroundDataType | null>;

	// separate into rep and excluded wells. Do not normalize so ratio data isn't normalized 2x in later call to useViwerFilteredWells
	const { viewerCalculatedData: calculatedBackgroundData } = useViewerFilteredWells({
		align,
		calculatedBackgroundData: _calculatedBackgroundData,
		eurMap,
		fitPhaseType,
		headersMap,
		normalize: false,
		phaseWellFilterWells: phaseRepWells,
	});

	const { viewerCalculatedData: calculatedExcludedData } = useViewerFilteredWells({
		align,
		calculatedBackgroundData: _calculatedBackgroundData,
		eurMap,
		fitPhaseType,
		headersMap,
		normalize: false,
		phaseWellFilterWells: phaseExcludedWells,
	});

	const phaseData = useMemo(
		() => getPhaseData({ calculatedBackgroundData, align, fitPhaseType, normalize }),
		[align, calculatedBackgroundData, fitPhaseType, normalize]
	);

	const fitSeries = useMemo(
		() =>
			tcFits
				? _.reduce(
						tcFits,
						(acc, phaseFit, phase) => {
							const { series, validSeries } = getSeriesInfo(phaseFit, fitPhaseType?.[phase]);
							if (validSeries) {
								acc[phase] = series;
							}

							return acc;
						},
						{ oil: {}, gas: {}, water: {} }
				  )
				: { oil: {}, gas: {}, water: {} },
		[fitPhaseType, tcFits]
	);

	const alignAdjustedFitSeries = useMemo(
		() =>
			tcFits
				? _.mapValues(fitSeries, (phaseSeries, phase) => {
						const fitAlign = tcFits?.[phase]?.align;
						if (!fitAlign || !isValidPDict(phaseSeries)) {
							return {};
						}

						const isMatching = fitAlign === align;
						return _.reduce(
							forecastSeries,
							(acc, { value: pSeries }) => {
								const { segments } = phaseSeries[pSeries];
								acc[pSeries] = {
									segments:
										isMatching || fitPhaseType[phase] === 'ratio'
											? segments
											: shiftNonMatchingSegments(segments, fitAlign),
								};
								return acc;
							},
							{}
						);
				  })
				: { oil: {}, gas: {}, water: {} },
		[align, fitPhaseType, fitSeries, tcFits]
	);

	const eurs = useMemo(() => {
		const retEurs = {
			oil: { P10: 0, P50: 0, P90: 0, best: 0 },
			gas: { P10: 0, P50: 0, P90: 0, best: 0 },
			water: { P10: 0, P50: 0, P90: 0, best: 0 },
		};

		_.forEach(phases, ({ value: phase }) => {
			const phaseType = fitPhaseType[phase];
			_.forEach(forecastSeries, ({ value: series }) => {
				const segments = fitSeries[phase]?.[series]?.segments ?? [];
				const baseSegments = fitSeries[basePhase]?.[series]?.segments ?? [];
				if (segments?.length) {
					const endDataIdx = -10000;
					const leftIdx = segments[0]?.start_idx ?? endDataIdx;
					const rightIdx = segments[segments.length - 1]?.end_idx ?? 0;
					if (phaseType === 'rate') {
						retEurs[phase][series] = multiSeg.rateEur({
							cumData: 0,
							endDataIdx,
							leftIdx,
							rightIdx,
							forecastSegments: segments,
							dataFreq: 'monthly',
						});
					} else if (baseSegments?.length) {
						retEurs[phase][series] = multiSeg.ratioEurInterval({
							cumData: 0,
							endDataIdx,
							leftIdx,
							rightIdx,
							ratioTSegments: segments,
							baseSegments: getShiftBaseSegments(segments, baseSegments),
							dataFreq: 'monthly',
						});
					}
				}
			});
		});

		return retEurs;
	}, [basePhase, fitPhaseType, fitSeries]);

	const generatePhaseTcFit = useCallbackRef(
		({
			eurPercentile = false,
			normalize,
			pDict,
			phase,
		}: {
			eurPercentile?: boolean;
			normalize: boolean;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			pDict: any;
			phase: Phase;
		}) => {
			const phaseType = fitPhaseType[phase];
			const output = {
				adjusted: true,
				align: phaseType === 'rate' ? align : 'noalign',
				basePhase,
				eurPercentile,
				fitType: phaseType,
				normalize,
				resolution,
				typeCurve: typeCurveId,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			} as any;

			if (phaseType === 'rate') {
				output.P_dict = pDict;
			} else {
				output.ratio_P_dict = _.mapValues(pDict, (pSeries) => ({
					...pSeries,
					basePhase,
					diagnostics: null,
					x: 'time',
				}));
			}

			return output;
		}
	);

	const manualProps = useTypeCurveManual({ basePhase, phaseTypes: fitPhaseType, tcFits, fitSeries });
	const fitProps = useTypeCurveFit({
		align,
		basePhase,
		calculatedBackgroundData,
		fitConfigProps,
		generatePhaseTcFit,
		normalize,
		phaseData,
		phaseRepWells,
		phaseTypes: fitPhaseType,
		resolution,
		setTcFits,
		tcFits,
		tcFitsQueryData,
		typeCurveId,
	});

	const phaseWellFilterWells = useMemo(
		() => ({
			oil: wellFilterWells,
			gas: wellFilterWells,
			water: wellFilterWells,
		}),
		[wellFilterWells]
	);

	// apply filters
	const { viewerCalculatedData, viewerEurMap, viewerHeadersMap, viewerPhaseData, uniqueHeaderValueCounts } =
		useViewerFilteredWells({
			align,
			calculatedBackgroundData,
			eurMap,
			fitPhaseType,
			headersMap,
			normalize,
			phaseWellFilterWells,
		});

	const { viewerCalculatedData: viewerExcludedData, viewerPhaseData: viewerExcludedPhaseData } =
		useViewerFilteredWells({
			align,
			calculatedBackgroundData: calculatedExcludedData,
			eurMap,
			fitPhaseType,
			headersMap,
			normalize,
			phaseWellFilterWells,
		});

	const viewerData = useMemo(
		() => ({
			align,
			alignAdjustedFitSeries,
			basePhase,
			calculatedBackgroundData: viewerCalculatedData,
			calculatedExcludedData: viewerExcludedData,
			eurMap: viewerEurMap,
			eurs,
			excludedPhaseData: viewerExcludedPhaseData,
			fitSeries,
			headersMap: viewerHeadersMap,
			manualHasSaved,
			phaseData: viewerPhaseData,
			phaseExcludedWells,
			phaseRepWells,
			phaseTypes: fitPhaseType,
			tcFits,
			typeCurveId,
			uniqueHeaderValueCounts,
			wellFilterWells,
		}),
		[
			align,
			alignAdjustedFitSeries,
			basePhase,
			viewerCalculatedData,
			viewerExcludedData,
			viewerEurMap,
			eurs,
			viewerExcludedPhaseData,
			fitSeries,
			viewerHeadersMap,
			viewerPhaseData,
			phaseExcludedWells,
			phaseRepWells,
			fitPhaseType,
			tcFits,
			typeCurveId,
			uniqueHeaderValueCounts,
			wellFilterWells,
			manualHasSaved,
		]
	);

	const controlsProps = useMemo(() => {
		if (mode === 'view') {
			return { phaseRepWells, selection, typeCurveId };
		}
		if (mode === 'fit') {
			return {
				...fitProps,
				align,
				basePhase,
				calculatedBackgroundData,
				fitSeries,
				phaseData,
				phaseRepWells,
				resetTcFits,
			};
		}
		if (mode === 'normalization') {
			return {
				...normalizationProps,
				phaseRepWells,
				phaseTypes: fitPhaseType,
				typeCurveId,
			};
		}
		if (mode === 'manual') {
			return {
				...manualProps,
				align,
				basePhase,
				fitInit,
				fitSeries,
				generatePhaseTcFit,
				loadingStatuses,
				normalize,
				phaseTypes: fitPhaseType,
				resolution,
				setManualHasSaved,
				tempFitActive: fitProps.tempFitActive,
				typeCurveId,
			};
		}
	}, [
		align,
		basePhase,
		calculatedBackgroundData,
		fitInit,
		fitPhaseType,
		fitProps,
		fitSeries,
		generatePhaseTcFit,
		loadingStatuses,
		manualProps,
		mode,
		normalizationProps,
		normalize,
		phaseData,
		phaseRepWells,
		resetTcFits,
		resolution,
		selection,
		typeCurveId,
	]);

	const parametersProps = useMemo(
		() => ({
			basePhase,
			eurs,
			fitSeries,
			phaseTypes: fitPhaseType,
			tcFits,
		}),
		[basePhase, eurs, fitPhaseType, fitSeries, tcFits]
	);

	useEffect(() => {
		setExpanded(false);
	}, [mode]);

	return (
		<ModeLayoutContainer>
			<ControlsContainer expanded={expanded}>
				<div>
					<div
						css={`
							align-items: center;
							display: flex;
							justify-content: space-between;
						`}
					>
						<Tabs
							indicatorColor='secondary'
							onChange={async (_ev, newValue) => {
								if (
									fitProps.tempFitActive ||
									normalizationProps.isEdited ||
									(mode === 'manual' && manualProps.manualEdited)
								) {
									if (await showUnsavedWorkDialog()) {
										if (fitProps.tempFitActive || fitProps.percentileFit) {
											resetTcFits();
											fitProps.setPercentileFit(null);
										}
										if (normalizationProps.isEdited) {
											normalizationProps.resetData();
										}
									} else {
										return;
									}
								}

								setMode(newValue);
							}}
							textColor='secondary'
							value={mode}
						>
							{modes.map(({ label, value }) => (
								<Tab
									css={`
										min-width: unset;
										text-transform: unset;
									`}
									key={value}
									label={label}
									value={value}
								/>
							))}
						</Tabs>

						{mode === 'view' && (
							<IconButton
								onClick={() => setExpanded((u) => !u)}
								size='small'
								tooltipTitle={expanded ? 'Collapse' : 'Expand'}
							>
								{expanded ? faChevronDoubleLeft : faChevronDoubleRight}
							</IconButton>
						)}
					</div>

					<Divider />
				</div>

				<ForecastToolbarTheme>
					<div
						css={`
							align-items: baseline;
							display: flex;
						`}
					>
						<div
							css={`
								display: flex;
								flex-direction: column;
								margin-right: 5rem;
								row-gap: 0.5rem;
							`}
						>
							<span>Resolution</span>
							<ToggleButtonGroup
								exclusive
								onChange={(_ev, value) => {
									if (value) {
										setResolution(value);
									}
								}}
								value={resolution}
								size='small'
							>
								<FitToggleButton value='daily'>
									<span css='text-transform: none'>Daily</span>
								</FitToggleButton>

								<FitToggleButton value='monthly'>
									<span css='text-transform: none'>Monthly</span>
								</FitToggleButton>
							</ToggleButtonGroup>
						</div>

						<div
							css={`
								display: flex;
								flex-direction: column;
								row-gap: 0.25rem;
							`}
						>
							<SwitchField checked={align === 'align'} label='Align Peaks' onChange={toggleAlign} />

							<InfoTooltipWrapper
								placeIconAfter
								tooltipTitle='Must be on to save normalization correlation with the type curve'
							>
								<SwitchField checked={normalize} label='Normalize' onChange={toggleNormalize} />
							</InfoTooltipWrapper>
						</div>
					</div>
				</ForecastToolbarTheme>

				{!loadingStatuses.fitInitIsLoading && <ControlsLayout mode={mode} {...controlsProps} />}
			</ControlsContainer>

			<ChartGridLayout
				allWellIds={allWellIds}
				collapsed={expanded}
				handleOnQuickWellFilter={handleOnQuickWellFilter}
				handleWellFilter={handleWellFilter}
				loadingStatuses={loadingStatuses}
				manualProps={mode === 'manual' ? manualProps : undefined}
				mode={mode}
				normalizationProps={mode === 'normalization' ? normalizationProps : undefined}
				parametersProps={parametersProps}
				resetWellFilter={resetWellFilter}
				resolution={resolution}
				selection={selection}
				typeCurveId={typeCurveId}
				viewerData={viewerData}
				wellFilterActive={wellFilterActive}
			/>
		</ModeLayoutContainer>
	);
}

export default ModeLayout;
