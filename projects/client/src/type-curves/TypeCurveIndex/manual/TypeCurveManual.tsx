import { MultipleSegments } from '@combocurve/forecast/models';
import { faUndo } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useMutation } from 'react-query';

import { getTaggingProp } from '@/analytics/tagging';
import { Placeholder } from '@/components';
import { useDerivedState, useHotkey } from '@/components/hooks';
import { PhaseSelectField } from '@/components/misc';
import { Button, Divider, IconButton, Typography } from '@/components/v2';
import { SelectField } from '@/components/v2/misc';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import ManualEditing from '@/forecasts/manual/ManualEditing';
import { ManualEditingContext } from '@/forecasts/manual/ManualEditingContext';
import { KeyboardModeIndicator } from '@/forecasts/manual/shared';
import { ParametersDescriptionWithFloater } from '@/forecasts/shared/ForecastParametersDescription';
import useKeyboardForecast from '@/forecasts/shared/useKeyboardForecast';
import { confirmationAlert, genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';
import { postApi, putApi } from '@/helpers/routing';
import { showUnsavedWorkDialog } from '@/helpers/unsaved-work';
import { forecastSeries, phases } from '@/helpers/zing';
import { isValidPDict } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/helpers';
import { KEYS as FIT_TC_KEYS } from '@/type-curves/TypeCurveFit/keys';
import { LoadingStatuses } from '@/type-curves/charts/graphProperties';

import { bSeriesMenuItems } from '../fit/helpers';
import { FormContent, FormFooter, FormTitle } from '../shared/formLayout';
import { Align, BKey, FitPhaseTypes, FitResolution, PhaseSeries } from '../types';

const multiSeg = new MultipleSegments();

const useTypeCurveManual = ({ basePhase, fitSeries, phaseTypes, tcFits }) => {
	const { speedState, setSpeedState } = useKeyboardForecast({ saveLocally: true });

	const [basePhaseSeries, setBasePhaseSeries] = useState<PhaseSeries>('best');
	const [bKey, setBKey] = useState<BKey>('average');
	const [phase, setPhase] = useState<Phase>('oil');

	const { manualSeries, pKey } = useContext(ManualEditingContext);
	const [initSeries, setInitSeries] = useDerivedState(fitSeries?.[phase]?.[pKey]?.segments ?? [], [
		fitSeries?.[phase]?.[pKey]?.segments,
	]);

	const manualEdited = useMemo(
		() => !_.isEqual({ series: manualSeries }, { series: initSeries }),
		[initSeries, manualSeries]
	);

	const baseSegments = useMemo(
		() => tcFits?.[basePhase]?.P_dict?.[basePhaseSeries]?.segments ?? [],
		[basePhase, basePhaseSeries, tcFits]
	);

	const getShiftBaseSegments = useCallback(
		(ratioSegments) => {
			if (ratioSegments?.length && baseSegments?.length) {
				const deltaT = ratioSegments[0].start_idx - baseSegments[0].start_idx;
				return multiSeg.shiftSegmentsIdx({ inputSegments: baseSegments, deltaT });
			}
			return baseSegments;
		},
		[baseSegments]
	);

	return {
		basePhaseSeries,
		baseSegments,
		bKey,
		getShiftBaseSegments,
		initSeries,
		manualEdited,
		phase,
		phaseType: phaseTypes?.[phase],
		setBasePhaseSeries,
		setBKey,
		setInitSeries,
		setPhase,
		setSpeedState,
		speedState,
	};
};

function TypeCurveManual({
	align,
	basePhase,
	bKey,
	fitInit,
	fitSeries,
	getShiftBaseSegments,
	initSeries,
	loadingStatuses,
	manualEdited,
	normalize,
	phase,
	phaseType,
	phaseTypes,
	resolution,
	setBKey,
	setInitSeries,
	setPhase,
	speedState,
	setManualHasSaved,
	typeCurveId,
}: ReturnType<typeof useTypeCurveManual> & {
	align: Align;
	basePhase: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	fitInit: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	fitSeries: { [key in Phase]: any };
	loadingStatuses: LoadingStatuses;
	normalize: boolean;
	phaseTypes: FitPhaseTypes;
	resolution: FitResolution;
	setManualHasSaved: (value: boolean) => void;
	typeCurveId: string;
}) {
	const { canUndo, undo, getManualSeries, manualSeries, onForm, pKey, segIdx, setPKey, setSegIdx } =
		useContext(ManualEditingContext);

	const controlsRef = useRef({});

	const changePhase = async (value) => {
		if (manualEdited && !(await showUnsavedWorkDialog())) {
			return;
		}
		setPhase(value as Phase);
	};

	const getNextPhase = (phase) => {
		const phaseValues = phases.map(({ value }) => value);
		const nextIdx = (phaseValues.findIndex((curPhase) => curPhase === phase) + 1) % phaseValues.length;
		return phaseValues[nextIdx];
	};

	const phaseChangeHandler = (phaseHotkey) => () => {
		if (phase !== phaseHotkey && !onForm) {
			changePhase(phaseHotkey);
			return false;
		}
		return undefined;
	};

	const cyclePhase = () => {
		if (!onForm) {
			const nextPhase = getNextPhase(phase);
			changePhase(nextPhase);
			return false;
		}
		return undefined;
	};

	useHotkey('shift+o', phaseChangeHandler('oil'));
	useHotkey('shift+g', phaseChangeHandler('gas'));
	useHotkey('shift+w', phaseChangeHandler('water'));
	useHotkey('shift+s', cyclePhase);

	const viewParamsPDict = useMemo(
		() =>
			produce(fitSeries[phase], (draft) => {
				draft[pKey] = { segments: manualSeries };
			}),
		[fitSeries, manualSeries, pKey, phase]
	);

	const shiftedBaseSegments = useMemo(
		() => getShiftBaseSegments(viewParamsPDict?.[pKey]?.segments ?? []),
		[getShiftBaseSegments, pKey, viewParamsPDict]
	);

	const { mutateAsync: updateQFinalDict } = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async ({ values, phaseKey }: { values: any; phaseKey: string }) => {
			try {
				await putApi(`/type-curve/${typeCurveId}/updateTypeCurvePhaseQFinal`, {
					phase: phaseKey,
					values,
				});

				queryClient.setQueryData(
					FIT_TC_KEYS.fitInit(typeCurveId),
					produce<{ qFinalDict }>((draft) => {
						draft.qFinalDict[phaseKey] = values;
					})
				);
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	);

	const { mutateAsync: saveManualFit, isLoading: saving } = useMutation(async () => {
		const newFitSeries = produce(fitSeries[phase], (draft) => {
			if (isValidPDict(fitSeries[phase])) {
				draft[pKey] = { segments: _.cloneDeep(getManualSeries()) };
			} else {
				_.forEach(forecastSeries, ({ value: series }) => {
					draft[series] = { segments: _.cloneDeep(getManualSeries()) };
				});
			}
		});

		const { message, fit } = await withLoadingBar(
			postApi(`/type-curve/${typeCurveId}/save-fit`, {
				adjusted: true,
				align,
				basePhase,
				eurPercentile: false,
				fitType: phaseType,
				normalize,
				P_dict: newFitSeries,
				phase,
				resolution,
				settings: null,
			})
		);

		confirmationAlert(message);
		queryClient.setQueryData(
			FIT_TC_KEYS.tcFits(typeCurveId),
			produce<object>((draft) => {
				draft[phase] = fit;
			})
		);

		setManualHasSaved(true);
	});

	const { fitInitIsLoading, tcFitsIsLoading } = loadingStatuses;

	return (
		<Placeholder loading={fitInitIsLoading || tcFitsIsLoading} minShow={50} minHide={500} forceOnFirstRender>
			<FormTitle>
				<Typography css='font-weight: 500;' variant='body1'>
					Manual Fit
				</Typography>

				<IconButton
					disabled={!canUndo && 'No changes detected'}
					onClick={undo}
					size='small'
					tooltipTitle='Undo changes'
				>
					{faUndo}
				</IconButton>
			</FormTitle>

			<Divider />

			<PhaseSelectField basePhase={basePhase} onChange={changePhase} phaseTypes={phaseTypes} value={phase} />

			<ForecastToolbarTheme>
				<FormContent>
					<Divider />

					<span css='margin-bottom: 0.5rem'>
						<KeyboardModeIndicator editAreaFocused={!onForm} />
					</span>

					<SelectField
						label='Background Aggregate'
						menuItems={bSeriesMenuItems}
						onChange={(ev) => setBKey(ev.target.value as BKey)}
						size='small'
						value={bKey}
						variant='outlined'
					/>

					<Divider />

					<ManualEditing
						// canUpdate={canUpdateTypeCurve}
						basePhase={fitInit?.basePhase ?? 'oil'}
						canUpdate
						editBase='typecurve'
						editSaveForecast={() => saveManualFit()}
						editSaveQFinalDict={updateQFinalDict}
						forecastType={phaseType}
						idxDate
						initSeries={initSeries}
						inputQFinalDict={fitInit?.qFinalDict}
						noPadding
						phase={phase}
						ref={controlsRef}
						speedState={speedState}
					/>

					<ParametersDescriptionWithFloater
						basePhase={fitInit.basePhase}
						baseSegments={shiftedBaseSegments}
						forecastType={phaseType}
						idxDate
						pDict={viewParamsPDict}
						phase={phase}
						phaseTypes={fitInit.phaseType}
						pKey={pKey}
						segIdx={segIdx}
						setPhase={setPhase}
						setPKey={setPKey}
						setSegIdx={setSegIdx}
						type='probabilistic'
					/>
				</FormContent>
			</ForecastToolbarTheme>

			<Divider />

			<FormFooter>
				<Button
					onClick={() => {
						setInitSeries(_.cloneDeep(fitSeries?.[phase]?.[pKey]?.segments));
					}}
					disabled={!manualEdited}
					size='small'
				>
					Reset
				</Button>

				<Button
					color='secondary'
					disabled={!manualEdited || saving}
					onClick={() => saveManualFit()}
					size='small'
					variant='contained'
					{...getTaggingProp('typeCurve', 'manualSave')}
				>
					Save
				</Button>
			</FormFooter>
		</Placeholder>
	);
}

export default TypeCurveManual;
export { useTypeCurveManual };
