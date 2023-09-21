import { convertDateToIdx } from '@combocurve/forecast/helpers';
import { faUserCog } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import { Placeholder } from '@/components';
import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { Divider, IconButton, Typography } from '@/components/v2';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { confirmationAlert, withLoadingBar } from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';
import { postApi } from '@/helpers/routing';
import { phases } from '@/helpers/zing';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/typecurve_forms.json';
import { fields as dailyUnitTemplate } from '@/inpt-shared/display-templates/units/daily-units.json';
import { fields as defaultUnitTemplate } from '@/inpt-shared/display-templates/units/default-units.json';
import { getConvertFunc } from '@/inpt-shared/helpers/units';
import { generateRawBackgroundDataBody } from '@/type-curves/TypeCurveFit/api';
import { KEYS as TC_FIT_KEYS } from '@/type-curves/TypeCurveFit/keys';
import { getProdFit } from '@/type-curves/shared/fit-tc/daily-helpers';
import { useTypeCurveInfo } from '@/type-curves/shared/useTypeCurveInfo';

import { Align, CalculatedBackgroundDataType, FitPhaseTypes, FitResolution, PhaseData, PhaseSeries } from '../types';
import AutoFit from './AutoFit';
import { getSeriesInfo } from './helpers';
import useAutoFitForm from './useAutoFitForm';

const useTypeCurveFit = ({
	align,
	basePhase,
	calculatedBackgroundData,
	fitConfigProps,
	generatePhaseTcFit,
	normalize,
	phaseData,
	phaseRepWells,
	phaseTypes,
	resolution,
	setTcFits,
	tcFits,
	tcFitsQueryData,
	typeCurveId,
}: {
	align: Align;
	basePhase: Phase;
	calculatedBackgroundData: CalculatedBackgroundDataType;
	fitConfigProps: ReturnType<typeof useConfigurationDialog>;
	generatePhaseTcFit: ({
		phase,
		normalize,
		pDict,
		eurPercentile,
	}: {
		phase: Phase;
		normalize: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		pDict: any;
		eurPercentile: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	}) => any;
	normalize: boolean;
	phaseData: PhaseData;
	phaseRepWells: Record<Phase, Array<string>>;
	phaseTypes: FitPhaseTypes;
	resolution: FitResolution;
	setTcFits: (value) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	tcFits: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	tcFitsQueryData: any;
	typeCurveId: string;
}) => {
	const track = useTrackAnalytics();
	const { wellsInfoMap, success: tcInfoSuccess } = useTypeCurveInfo(typeCurveId);

	const [basePhaseSeries, setBasePhaseSeries] = useState<PhaseSeries>('best'); // Can probably make it a non-state const.
	const [eurPercentile, _setEurPercentile] = useDerivedState(
		{
			oil: tcFitsQueryData.oil?.eurPercentile,
			gas: tcFitsQueryData.gas?.eurPercentile,
			water: tcFitsQueryData.water?.eurPercentile,
		},
		[tcFitsQueryData]
	);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [percentileFit, setPercentileFit] = useState<any>(null);

	const setEurPercentile = useCallbackRef((phase: Phase, value) =>
		_setEurPercentile((curValues) => ({ ...curValues, [phase]: value }))
	);

	const tempFitActive = useMemo(() => {
		const queryDataSeriesInfo = _.reduce(
			tcFitsQueryData ?? {},
			(acc, value, phase) => {
				acc[phase] = getSeriesInfo(value, phaseTypes[phase]);
				return acc;
			},
			{}
		);

		const tcFitsSeriesInfo = _.reduce(
			tcFits ?? {},
			(acc, value, phase) => {
				acc[phase] = getSeriesInfo(value, phaseTypes[phase]);
				return acc;
			},
			{}
		);

		return !_.isEqual(tcFitsSeriesInfo, queryDataSeriesInfo);
	}, [phaseTypes, tcFits, tcFitsQueryData]);

	const applyPercentileFit = useCallbackRef((newPercentileFit, formValues = null) => {
		if (!newPercentileFit) {
			return;
		}

		setTcFits(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any) => {
				_.forEach(newPercentileFit, (percentileFit, phase) => {
					draft[phase] = generatePhaseTcFit({
						phase,
						normalize,
						pDict: getProdFit(
							percentileFit,
							phaseTypes[phase] === 'rate' && eurPercentile[phase] ? 'after' : 'before'
						),
						eurPercentile: eurPercentile[phase],
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					} as any);

					if (formValues) {
						draft[phase].settings = formValues[phase];
					}
				});
			})
		);
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { mutateAsync: handleFitRequest, isLoading: isFitLoading } = useMutation(async (formValues: any) => {
		const phases = formValues.phases;
		const body = _.reduce(
			formValues,
			(result, value, key) => {
				if (!['phases', 'tcId'].includes(key)) {
					const phase = key;

					if (!(calculatedBackgroundData[phase] && phaseData[phase] && tcInfoSuccess)) {
						phases[phase] = false;
						return result;
					}

					const phaseType = phaseTypes?.[phase];
					const {
						addSeries,
						addSeriesFitRange,
						b0,
						b,
						b2,
						b1,
						best_fit_q_peak,
						buildup,
						D_lim_eff,
						D1_eff,
						D2_eff,
						fit_complexity,
						minus_t_decline_t_0,
						minus_t_elf_t_peak,
						minus_t_peak_t0,
						p1_range,
						q_final,
						q_peak,
						TC_model,
						well_life,
					} = value;

					const dates = addSeriesFitRange.map((date) => convertDateToIdx(new Date(date)));
					const templateKey = phaseType === 'rate' && basePhase ? phase : `${phase}/${basePhase}`;
					const convert = getConvertFunc(defaultUnitTemplate[templateKey], dailyUnitTemplate[templateKey]);

					const TCpDict = {
						b0,
						b,
						b2,
						b1,
						buildup,
						D_lim_eff,
						D1_eff,
						D2_eff,
						minus_t_elf_t_peak,
						q_final,
						q_peak,
						minus_t_peak_t0,
						minus_t_decline_t_0,
						TC_model,
						well_life,
					};

					_.forEach(formTemplates?.[phaseType]?.[TC_model]?.params ?? {}, (paramValues, param) => {
						if (paramValues.requiresUnitTransform) {
							// run transform
							if (paramValues.type === 'range') {
								TCpDict[param] = TCpDict[param].map((value) => convert(value));
							} else {
								TCpDict[param] = convert(TCpDict[param]);
							}
						}
					});

					const body = {
						basePhase,
						basePhaseSegments: null,
						basePhaseSeries,
						best_fit_method: addSeries,
						best_fit_q_peak,
						best_fit_range: dates,
						data_gen_params: generateRawBackgroundDataBody({
							phase,
							resolution,
							tcId: typeCurveId,
							wells: phaseRepWells[phase],
							wellsInfoMap,
						}),
						fit_para: { data: align, fit_complexity, p1_range, TC_percentile: [10, 50, 90] },
						normalization: normalize
							? calculatedBackgroundData[phase].normalization
							: new Array(calculatedBackgroundData[phase].normalization.length).fill([1, 1]),
						eur_normalization:
							normalize && calculatedBackgroundData[phase].multipliers
								? calculatedBackgroundData[phase].multipliers.map((v) => v.eur)
								: new Array(calculatedBackgroundData[phase].normalization.length).fill(1),
						phase,
						phaseType,
						TC_para_dict: TCpDict,
					};

					if (phaseType === 'ratio') {
						body.basePhaseSegments = tcFits?.[basePhase]?.P_dict?.[basePhaseSeries].segments ?? [];
					}

					result[key] = body;
				}
				return result;
			},
			{ phases, tcId: typeCurveId }
		);

		const newPercentileFit = await withLoadingBar(postApi(`/type-curve/${typeCurveId}/fit-percentile`, body));
		setPercentileFit(newPercentileFit);
		applyPercentileFit(newPercentileFit, formValues);
	});

	const {
		activeConfig,
		configDialog,
		form,
		formError,
		handleModelChange,
		handleSubmit,
		showConfigDialog,
		togglePhase,
	} = useAutoFitForm({
		align,
		fitConfigProps,
		handleFitRequest,
		initSettings: useMemo(() => {
			const { oil, gas, water } = tcFits;
			return {
				phases: {
					oil: Boolean(oil?.adjusted),
					gas: Boolean(gas?.adjusted),
					water: Boolean(water?.adjusted),
				},
				oil: oil?.settings,
				gas: gas?.settings,
				water: water?.settings,
			};
		}, [tcFits]),
		normalize,
		phaseRepWells,
		phaseTypes,
		resolution,
	});

	const trackSaveAutoFitTypeCurve = () => {
		const data = phases.reduce((acc, { value }) => {
			const includedSet = new Set(phaseRepWells[value]);
			const included = includedSet.size;
			let excluded = 0;
			let invalid = 0;

			wellsInfoMap?.forEach(({ well_id, valid }) => {
				if (!includedSet.has(well_id)) {
					if (valid[value]) {
						++excluded;
					} else {
						++invalid;
					}
				}
			});

			acc[value] = {
				included,
				excluded,
				invalid,
			};

			return acc;
		}, {});

		track(EVENTS.typeCurve.saveFit, data);
	};

	const { mutateAsync: saveAutoFitTypeCurve, isLoading: saving } = useMutation(async () => {
		trackSaveAutoFitTypeCurve();
		// hit API
		const message = await withLoadingBar(postApi(`/type-curve/${typeCurveId}/save-fits`, { tcFits }));
		confirmationAlert(message);

		// adjust query
		queryClient.setQueryData(TC_FIT_KEYS.tcFits(typeCurveId), tcFits);
		setPercentileFit(null);
	});

	const applyEurPercentile = useCallbackRef(() => {
		applyPercentileFit(percentileFit);
	});

	useEffect(() => {
		applyEurPercentile();
	}, [applyEurPercentile, eurPercentile]);

	return {
		activeConfig,
		basePhaseSeries,
		configDialog,
		eurPercentile,
		form,
		formError,
		handleModelChange,
		handleSubmit,
		percentileFit,
		saveAutoFitTypeCurve,
		isFitLoading,
		saving,
		setBasePhaseSeries,
		setEurPercentile,
		setPercentileFit,
		showConfigDialog,
		tempFitActive,
		togglePhase,
	};
};

function TypeCurveFit({
	align,
	basePhase,
	calculatedBackgroundData,
	configDialog,
	eurPercentile,
	form,
	formError,
	handleModelChange,
	handleSubmit,
	percentileFit,
	phaseData,
	phaseRepWells,
	resetTcFits,
	saveAutoFitTypeCurve,
	saving,
	isFitLoading,
	setEurPercentile,
	showConfigDialog,
	tempFitActive,
	togglePhase,
}: ReturnType<typeof useTypeCurveFit> & {
	align?: Align;
	isFitLoading?: boolean;
	basePhase: Phase;
	calculatedBackgroundData: Record<Phase, CalculatedBackgroundDataType | null>;
	phaseData: PhaseData;
	phaseRepWells: Record<Phase, Array<string>>;
	resetTcFits: () => void;
	tempFitActive?: boolean;
}) {
	return (
		<Placeholder minShow={50} minHide={500} forceOnFirstRender>
			{configDialog}

			<div
				css={`
					align-items: center;
					display: flex;
					justify-content: space-between;
				`}
			>
				<Typography css='font-weight: 500;' variant='body1'>
					Auto Fit
				</Typography>

				<div
					css={`
						align-items: center;
						column-gap: 0.5rem;
						display: flex;
					`}
				>
					<IconButton onClick={showConfigDialog} size='small' tooltipTitle='Form Configurations'>
						{faUserCog}
					</IconButton>
				</div>
			</div>

			<Divider />

			<AutoFit
				align={align}
				basePhase={basePhase}
				calculatedBackgroundData={calculatedBackgroundData}
				eurPercentile={eurPercentile}
				form={form}
				formError={formError}
				handleModelChange={handleModelChange}
				handleSubmit={handleSubmit}
				percentileFit={percentileFit}
				phaseData={phaseData}
				phaseRepWells={phaseRepWells}
				resetTcFits={resetTcFits}
				saveAutoFitTypeCurve={saveAutoFitTypeCurve}
				saving={isFitLoading || saving}
				setEurPercentile={setEurPercentile}
				tempFitActive={tempFitActive}
				togglePhase={togglePhase}
			/>
		</Placeholder>
	);
}

export default TypeCurveFit;
export { useTypeCurveFit };
