/* eslint-disable @typescript-eslint/no-explicit-any */

import { convertDateToIdx } from '@combocurve/forecast/helpers';
import { clone, get, isEmpty, map } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { getTaggingProp } from '@/analytics/tagging';
import { Button, Divider, InfoTooltipWrapper, RHFForm, SwitchField } from '@/components/v2';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import ForecastFormControl, {
	CustomSelectField,
	FormControlRangeField,
	getFormControlRules,
} from '@/forecasts/forecast-form/ForecastFormControl';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import { local } from '@/helpers/storage';
import { labelWithUnit } from '@/helpers/text';
import { convertIdxToDate } from '@/helpers/zing';
import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/inpt-shared/access-policies/shared';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/typecurve_forms.json';
import { fields as dailyUnitTemplate } from '@/inpt-shared/display-templates/units/daily-units.json';
import { fields as defaultUnitTemplate } from '@/inpt-shared/display-templates/units/default-units.json';
import { getConvertFunc } from '@/inpt-shared/helpers/units';
import BuildupFields from '@/type-curves/TypeCurveIndex/fit/BuildupFields';
import ModelFields from '@/type-curves/TypeCurveIndex/fit/ModelFields';
import { TC_MODELS, TOOLTIPS } from '@/type-curves/TypeCurveIndex/fit/helpers';
import {
	FieldSection,
	FormContent,
	FormFooter,
	PhaseFormContainer,
	RHFFormStyles,
} from '@/type-curves/TypeCurveIndex/shared/formLayout';
import { CalculatedBackgroundDataType, PhaseType } from '@/type-curves/TypeCurveIndex/types';

import useProximityFitForm from './useProximityFitForm';

const PROXIMTIY_FORM_STORAGE_KEY_TEMPLATE = 'proximity-form-fit-config-{0}-{1}';

// Non-robust implementation of a pythonesque/c# str.format
export const stringFormat = (str, args) => {
	let ret = clone(str);
	for (let i = 0; i < args.length; i++) ret = ret.replace('{' + i + '}', args[i]);
	return ret;
};

const FILTERED_WELLS_TOOLTIP_MESSAGE = 'All wells have been excluded';

function ProximityFit({
	align,
	basePhase,
	basePhaseSeries,
	calculatedBackgroundData,
	cumData,
	eurData,
	hasRunFit,
	normalize,
	noWells,
	phase,
	phaseRepWells,
	phaseType,
	prodData,
	projectId,
	proximityProps,
	requiredMinMax,
	resolution,
	selection,
	setForecastSegmentsCallback,
	setHasRunFit,
	setNormalize,
	setPercentileFit,
	tcFits,
	tcId,
	withLoading,
}: {
	align: string;
	basePhase: Phase;
	basePhaseSeries: any;
	calculatedBackgroundData: CalculatedBackgroundDataType | null;
	cumData: any;
	defaultFormConfig: any;
	eurData: any;
	hasRunFit: boolean;
	noWells?: boolean;
	normalize: boolean;
	phase: Phase;
	phaseType: PhaseType;
	phaseRepWells: string[];
	prodData: any;
	projectId: any;
	proximityProps: any;
	requiredMinMax: any;
	resolution: any;
	selection: any;
	setForecastSegmentsCallback: any;
	setHasRunFit: (boolean) => void;
	setNormalize: (boolean) => void;
	setPercentileFit: any;
	tcFits: any;
	tcId: string;
	withLoading: any;
}) {
	const [fitForecast, setFitForecast] = useState({});
	const [unfitForecast, setUnfitForecast] = useState({});
	const toggleNormalize = () => setNormalize((p) => !p);

	const cacheStorageKey = useMemo(
		() => stringFormat(PROXIMTIY_FORM_STORAGE_KEY_TEMPLATE, [phase, phaseType]),
		[phase, phaseType]
	);

	const localConfig = local.getItem(cacheStorageKey);
	const proximityFitConfig = useMemo(() => {
		// for some reason previous fit config saved buildup.apply as 0 or 1
		const { settings } = localConfig ?? {};
		return settings
			? { [phase]: { ...settings, buildup: { ...settings.buildup, apply: Boolean(settings.buildup.apply) } } }
			: null;
	}, [localConfig, phase]);

	const fitConfigProps = useMemo(() => ({ activeConfig: proximityFitConfig }), [proximityFitConfig]);

	const handleAutoFit = withLoading(
		useCallback(
			async (values) => {
				const {
					addSeriesFitRange,
					b0,
					b,
					b1,
					b2,
					best_fit_q_peak,
					buildup,
					D_lim_eff,
					D1_eff,
					D2_eff,
					fit_complexity,
					minus_t_elf_t_peak,
					minus_t_peak_t0,
					minus_t_decline_t_0,
					p1_range,
					q_final,
					q_flat,
					q_peak,
					TC_model,
					well_life,
				} = values;

				const dates = addSeriesFitRange.map((date) => convertDateToIdx(new Date(date)));
				const templateKey = phaseType === 'rate' && basePhase ? phase : `${phase}/${basePhase}`;
				const convert = getConvertFunc(defaultUnitTemplate[templateKey], dailyUnitTemplate[templateKey]);

				const init_data = {
					background_data: prodData,
					cum_dict: { ...calculatedBackgroundData?.cum_dict, ...cumData },
					eur: eurData.eur,
				};

				const TCpDict = {
					b0,
					b,
					b1,
					b2,
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
					q_flat,
				};

				Object.entries(formTemplates?.[phaseType]?.[TC_model]?.params ?? {}).forEach(
					([param, paramValues]: [any, any]) => {
						if (paramValues.requiresUnitTransform) {
							// run transform
							if (paramValues.type === 'range') {
								TCpDict[param] = TCpDict[param].map((value) => convert(value));
							} else {
								TCpDict[param] = convert(TCpDict[param]);
							}
						}
					}
				);

				const body: any = {
					best_fit_method: 'average',
					best_fit_q_peak,
					best_fit_range: dates,
					fit_para: { data: align, fit_complexity, p1_range, TC_percentile: [10, 50, 90] },
					init_data,
					phase,
					phaseType,
					TC_para_dict: TCpDict,
					tcId,
					basePhase,
					resolution,
				};

				if (phaseType === 'ratio') {
					body.basePhaseSegments = tcFits?.[basePhase]?.P_dict?.[basePhaseSeries].segments ?? [];
				}

				try {
					const { fit, new_forecast, unfit_forecast } = await postApi('/forecast/generateProximityFits', {
						fit_params: body,
						bg_data: {
							forecastId: proximityProps.forecastId,
							wellId: proximityProps.wellId,
							target_bg_data: proximityProps.targetBGData,
							resolution,
						},
					});

					setFitForecast(new_forecast);
					setUnfitForecast(unfit_forecast);
					setPercentileFit({ ...fit, phase, phaseType });
					local.setItem(cacheStorageKey, { settings: values });
					setHasRunFit(true);
				} catch (error) {
					genericErrorAlert(error);
				}
			},
			[
				align,
				basePhase,
				basePhaseSeries,
				cacheStorageKey,
				calculatedBackgroundData?.cum_dict,
				cumData,
				eurData?.eur,
				phase,
				phaseType,
				prodData,
				proximityProps.forecastId,
				proximityProps.targetBGData,
				proximityProps.wellId,
				resolution,
				setHasRunFit,
				setPercentileFit,
				tcFits,
				tcId,
			]
		)
	);

	// const defaultFormConfig = parentDefaultFormConfig ?? EMPTY_OBJ;

	const { form, handleSubmit } = useProximityFitForm({
		fitConfigProps,
		handleFitRequest: handleAutoFit,
		phase,
		phaseType,
		phaseRepWells,
	});

	const handleApplyToTargetWell = useCallback(
		async (shouldSave = false) => {
			try {
				const { fitToTargetData: fitToTarget, applySeries: fitKey } = form.getValues()[phase];
				// const fitToTarget = !!formikBundle.values.fitToTargetData;
				// const fitKey = formikBundle.values.applySeries;
				const segments = fitToTarget ? fitForecast?.[fitKey] : unfitForecast?.[fitKey];
				if (shouldSave) {
					await proximityProps.saveForecast(segments);
				} else {
					setForecastSegmentsCallback(segments);
					confirmationAlert('Applied fit to target well.');
				}
			} catch (error) {
				genericErrorAlert(error);
			}
		},
		[fitForecast, form, phase, proximityProps, setForecastSegmentsCallback, unfitForecast]
	);

	// auto fit props
	const {
		clearErrors,
		formState: { isSubmitting, errors, isValid },
		getValues,
		setValue,
		handleSubmit: formSubmit,
		watch,
	} = form;

	// Fit Phase Form Props
	const basePath = phase;
	const [tcModel] = watch([`${phase}.TC_model`]);
	const hasRepWells = phaseRepWells.length > 0;
	const availableModels = TC_MODELS[phaseType];
	const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, projectId);

	useEffect(() => {
		const { p1MinMax, qPeakMinMax, addSeriesFitRange } = requiredMinMax;
		const curValues = getValues();
		const isAbsoluteValue = get(curValues, `${basePath}.best_fit_q_peak.method`);

		const clearFields = [`${basePath}.p1_range`, `${basePath}.best_fit_q_peak.range`];

		setValue(`${basePath}.p1_range`, [p1MinMax?.min ?? -10_000, Math.round((p1MinMax?.max ?? 25_000) / 2)]);
		setValue(`${basePath}.best_fit_q_peak.range`, [
			qPeakMinMax?.min ?? (isAbsoluteValue ? 0.01 : 1),
			qPeakMinMax?.max ?? (isAbsoluteValue ? 20_000 : 99),
		]);

		if (addSeriesFitRange) {
			clearFields.push(`${basePath}.addSeriesFitRange`);
			setValue(
				`${basePath}.addSeriesFitRange`,
				map([addSeriesFitRange.min, addSeriesFitRange.max], (value) => convertIdxToDate(value))
			);
		}

		clearErrors(clearFields);
	}, [basePath, clearErrors, getValues, phase, requiredMinMax, setValue]);

	const isProximityRunButtonDisabled =
		(!canUpdateForecast && PERMISSIONS_TOOLTIP_MESSAGE) ||
		noWells ||
		(!selection.filteredArray?.length && FILTERED_WELLS_TOOLTIP_MESSAGE) ||
		!isValid;

	const diabledRunMessage = useMemo(() => {
		if (!hasRunFit) {
			return 'Cannot apply fit to target well until fit has ben "Run"';
		}
		if (isSubmitting) {
			return 'Running TC';
		}
		if (!isEmpty(errors)) {
			return 'Please correct the errors on the form';
		}
		return false;
	}, [errors, hasRunFit, isSubmitting]);

	return (
		<RHFForm css={RHFFormStyles} form={form} onSubmit={handleSubmit}>
			<FormContent>
				<ForecastToolbarTheme>
					<PhaseFormContainer css='justify-content: flex-end'>
						<InfoTooltipWrapper tooltipTitle={TOOLTIPS.normalize}>
							<SwitchField checked={normalize} label='Normalize' onChange={toggleNormalize} />
						</InfoTooltipWrapper>
					</PhaseFormContainer>
					<PhaseFormContainer>
						<CustomSelectField
							fullWidth
							label='Multi-Segment Fit Type'
							menuItems={availableModels}
							name={`${basePath}.TC_model`}
						/>

						<ModelFields
							basePath={basePath}
							basePhase={basePhase}
							hasRepWells={hasRepWells}
							phase={phase}
							phaseType={phaseType}
							tcModel={tcModel}
						/>

						{phaseType === 'rate' && tcModel !== 'flat_arps_modified' && (
							<>
								<Divider />
								<BuildupFields basePath={basePath} hasRepWells={hasRepWells} phase={phase} />
							</>
						)}

						<Divider />
						<FieldSection columns={2}>
							<FormControlRangeField
								dif={1}
								isInteger
								label='P-Series Fit Range (Days)'
								name={`${basePath}.p1_range`}
								required={hasRepWells}
								type='number'
								{...requiredMinMax.p1MinMax}
							/>
						</FieldSection>
						<Divider />

						{tcModel === 'flat_arps_modified' && (
							<FieldSection columns={2}>
								<ForecastFormControl
									label={labelWithUnit('Flat period rate', defaultUnitTemplate[phase])}
									name={`${basePath}.q_flat`}
									rules={getFormControlRules({
										min: 1e-2,
										max: 1000000,
										required: true,
									})}
									type='number'
								/>
							</FieldSection>
						)}
						<FieldSection columns={2}>
							<ForecastFormControl
								label='Apply Series To Target Well'
								menuItems={[
									{ value: 'average', label: 'Best Fit' },
									{ value: 'P10', label: 'P10' },
									{ value: 'P50', label: 'P50' },
									{ value: 'P90', label: 'P90' },
								]}
								name={`${basePath}.applySeries`}
								type='select'
							/>
							<ForecastFormControl
								label='Fit to target well production data'
								name={`${basePath}.fitToTargetData`}
								type='boolean'
							/>
						</FieldSection>
					</PhaseFormContainer>
				</ForecastToolbarTheme>
			</FormContent>

			<Divider />

			<FormFooter>
				<Button
					color='secondary'
					disabled={isProximityRunButtonDisabled}
					size='small'
					onClick={formSubmit(handleSubmit)}
					{...getTaggingProp('forecast', 'editingProximityRunFit')}
					variant='contained'
				>
					Run
				</Button>

				<Button
					color='secondary'
					disabled={diabledRunMessage}
					onClick={() => handleApplyToTargetWell()}
					size='small'
					variant='contained'
					{...getTaggingProp('forecast', 'editingProximityApplyFit')}
				>
					Apply
				</Button>

				<Button
					color='secondary'
					disabled={diabledRunMessage}
					onClick={() => handleApplyToTargetWell(true)}
					size='small'
					variant='contained'
					{...getTaggingProp('forecast', 'editingProximityApplySaveFit')}
				>
					Apply and Save
				</Button>
			</FormFooter>
		</RHFForm>
	);
}

export default ProximityFit;
