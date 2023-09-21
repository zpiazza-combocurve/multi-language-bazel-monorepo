import { MultipleSegments } from '@combocurve/forecast/models';
import { faCopy } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import { cloneDeep, get, isMatch, merge, set } from 'lodash';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useMutation } from 'react-query';

import { SHORT_PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Button, Divider, IconButton } from '@/components/v2';
import { updateSinglePhaseForecast } from '@/forecasts/api';
import { genFallbackSeries, scaleSeries } from '@/forecasts/charts/forecastChartHelper';
import { SegmentMenuItems } from '@/forecasts/charts/segmentComponents';
import {
	ControlFieldContainer,
	ControlFieldLabel,
	ControlsSectionContainer,
	InlineLabeled,
	StyledSelectField,
} from '@/forecasts/deterministic/manual/layout';
import ManualEditing from '@/forecasts/manual/ManualEditing';
import { ManualEditingContext } from '@/forecasts/manual/ManualEditingContext';
import { KeyboardModeIndicator } from '@/forecasts/manual/shared';
import ResolutionToggle from '@/forecasts/manual/shared/ResolutionToggle';
import { genericErrorAlert } from '@/helpers/alerts';
import { putApi } from '@/helpers/routing';
import { forecastSeries } from '@/helpers/zing';

import { EditingForm, PhaseSelectField } from './EditingLayout';
import { ForecastDescriptionPanel } from './ForecastDescriptionPanel';

const ProbabilisticManualEditingContainer = forwardRef((props, ref) => {
	const { changePhase, curData, curPhase, curWell, forecast, resolution, setParentState, setResolution } = props;

	const { undo, canUndo, manualSeries, onForm, pKey, segIdx, setMultipleSegments, setPKey, setSegIdx } =
		useContext(ManualEditingContext);

	const qFinalDict = useMemo(() => forecast?.qFinalDict ?? {}, [forecast]);
	const manualSeriesRef = useRef([]);
	const manualRef = useRef();

	const phaseData = useMemo(() => curData?.data?.[curPhase] ?? null, [curData, curPhase]);

	const prodInfo = useMemo(() => {
		const index = curData?.[resolution]?.index;
		return index ? { startIdx: index[0], endIdx: index[index.length - 1] } : { startIdx: null, endIdx: null };
	}, [curData, resolution]);

	// TODO: generate [] instead of a Fallback series, make the manual to work when segment length is 0
	const initSeries = useMemo(() => {
		const ret = phaseData?.P_dict?.[pKey]?.segments ?? genFallbackSeries();
		return ret.length === 0 ? genFallbackSeries() : ret;
	}, [phaseData, pKey]);

	const edited = useMemo(
		() => !isMatch({ series: initSeries }, { series: manualSeries }),
		[initSeries, manualSeries]
	);

	const isMonthly = resolution === 'monthly';

	const { isLoading: savingForecast, mutateAsync: saveForecast } = useMutation(
		async ({ saveCurPhase, savePKey, saveManualSeries }) => {
			try {
				const newData = produce(curData, (draft) => {
					// path to saving current phase's new forecast
					const saveDataPath = `data.${saveCurPhase}`;

					const pDict = get(draft, `${saveDataPath}.P_dict`) ?? { segments: [], diagnostics: {} };

					// default segments if they do not currently exist
					pDict[savePKey] ??= { segments: [], diagnostics: {} };
					pDict[savePKey].segments = saveManualSeries;

					// scale eurRatios if the current key is P50
					if (savePKey === 'P50') {
						const eurRatio = get(draft, `${saveDataPath}.p_extra.eur_ratio`) ?? {
							P10: 2,
							P50: 1,
							P90: 0.5,
						};

						// if there are no segments for the best fit series, default them to the new P50 series
						if (!pDict.best?.segments?.length) {
							eurRatio.best = 1;
						}

						set(
							draft,
							`${saveDataPath}.P_dict`,
							merge(cloneDeep(pDict), scaleSeries(saveManualSeries, eurRatio))
						);
					}

					set(draft, `${saveDataPath}.forecasted`, true);
					set(draft, `${saveDataPath}.forecastType`, 'manual');
				});

				const body = {
					phase: saveCurPhase,
					data: newData.data[saveCurPhase],
				};

				await updateSinglePhaseForecast(forecast._id, curData.headers._id, body);
				setParentState({ curData: newData });
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	);

	useImperativeHandle(ref, () => ({
		saveForecast: () => saveForecast({ saveCurPhase: curPhase, savePKey: pKey, saveManualSeries: manualSeries }),
	}));

	const handleChangeForecast = useCallback(
		(newState) => {
			setParentState({ forecast: newState });
		},
		[setParentState]
	);

	const updateQFinalDict = useCallback(
		async (newQFinalDict, phaseKey) => {
			handleChangeForecast(
				produce(forecast, (draft) => {
					draft.qFinalDict ??= {};
					draft.qFinalDict[phaseKey] = newQFinalDict;
				})
			);
			await putApi(`/forecast/${forecast._id}/updateForecastPhaseQFinal`, {
				phase: phaseKey,
				values: newQFinalDict,
			});
		},
		[handleChangeForecast, forecast]
	);

	const copySeries = useCallback(() => {
		let newSeries = phaseData?.P_dict?.best?.segments;
		if (pKey === 'best') {
			newSeries = phaseData?.P_dict?.P50?.segments;
		}

		newSeries ??= genFallbackSeries();
		const newMultiSegmentInstance = new MultipleSegments(newSeries);
		setMultipleSegments(newMultiSegmentInstance);
	}, [pKey, phaseData, setMultipleSegments]);

	useEffect(() => {
		manualSeriesRef.current = manualSeries;
	}, [manualSeries]);

	const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, forecast.project._id);

	return (
		<EditingForm
			actions={
				<>
					<Button
						color='primary'
						disabled={!canUpdateForecast || !edited || savingForecast}
						onClick={() =>
							saveForecast({ saveCurPhase: curPhase, savePKey: pKey, saveManualSeries: manualSeries })
						}
						tooltipPosition='right'
						tooltipTitle={!canUpdateForecast && SHORT_PERMISSIONS_TOOLTIP_MESSAGE}
					>
						Save
					</Button>

					<Button disabled={!edited} color='secondary' onClick={() => manualRef?.current?.reset?.()}>
						Reset
					</Button>

					<Button disabled={!canUndo && 'No changes detected'} color='secondary' onClick={undo}>
						Undo
					</Button>
				</>
			}
		>
			<PhaseSelectField onChange={changePhase} value={curPhase} />

			<Divider />

			<section>
				<KeyboardModeIndicator editAreaFocused={!onForm} />
			</section>

			<Divider />

			<ResolutionToggle resolution={resolution} setResolution={setResolution} />

			<InlineLabeled label='Series'>
				<StyledSelectField menuItems={forecastSeries} onChange={setPKey} smaller value={pKey} />
				{(pKey === 'P50' || pKey === 'best') && (
					<IconButton
						onClick={copySeries}
						tooltipPosition='left'
						tooltipTitle={`Copy from ${pKey === 'best' ? 'P50' : 'best'}`}
					>
						{faCopy}
					</IconButton>
				)}
			</InlineLabeled>

			<ControlsSectionContainer key='display-segments-container'>
				<ControlFieldContainer>
					<ControlFieldLabel small>Segment:</ControlFieldLabel>
					<SegmentMenuItems
						render={(menuItems) => (
							<StyledSelectField
								menuItems={menuItems}
								onChange={(value) => setSegIdx(value)}
								smaller
								value={segIdx}
							/>
						)}
						segments={manualSeries}
					/>
				</ControlFieldContainer>
			</ControlsSectionContainer>

			<Divider />

			<ManualEditing
				curWell={curWell}
				editBase='probabilistic-forecast'
				forecast={forecast}
				forecastId={forecast._id}
				initSeries={initSeries}
				onChangeForecast={handleChangeForecast}
				editSaveForecast={saveForecast}
				editSaveQFinalDict={updateQFinalDict}
				phase={curPhase}
				inputQFinalDict={qFinalDict}
				ref={manualRef}
				prodInfo={prodInfo}
				canUpdate={canUpdateForecast}
			/>

			<Divider />

			<ForecastDescriptionPanel
				dataFreq={phaseData?.data_freq}
				forecastType='rate'
				monthlyProduction={isMonthly && curData?.production}
				dailyProduction={!isMonthly && curData?.production}
				phase={curPhase}
				segIdx={segIdx}
				segments={manualSeries}
				series={pKey}
				wellId={curWell}
			/>
		</EditingForm>
	);
});

export default ProbabilisticManualEditingContainer;
