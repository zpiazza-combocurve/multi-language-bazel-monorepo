/* eslint-disable complexity */
// disabled for proximity form. TODO refactor this component
import { faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { FormikContext } from 'formik';
import produce from 'immer';
import { round } from 'lodash';
import { get } from 'lodash-es';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { PhaseSelectField } from '@/components/misc';
import { getValidateFn } from '@/components/shared';
import { Box, Button, Divider, IconButton, TextField as MUITextField } from '@/components/v2';
import { DatePicker, NumberRangeField, SimpleSelectField, SwitchField, TextField } from '@/components/v2/formik-fields';
import { ParametersDescriptionWithFloater } from '@/forecasts/shared/ForecastParametersDescription';
import { theme } from '@/helpers/styled';
import { labelWithUnit } from '@/helpers/text';
import { deepMerge } from '@/helpers/utilities';
import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/inpt-shared/access-policies/shared';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/typecurve_forms.json';
import { fields as defaultUnitTemplate } from '@/inpt-shared/display-templates/units/default-units.json';
import { ActionsContainer, FormContainer } from '@/type-curves/TypeCurveFit/TypeCurveControls/TypeCurveControlsLayout';
import {
	SHARED_SWITCH_PROPS,
	SimpleSwitchField,
	TCTooltippedField,
} from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/ControlComponents';
import {
	ADD_SERIES_MENU_OPTIONS,
	BEST_FIT_Q_PEAK_MENU_OPTIONS,
	TC_MODELS,
	TOOLTIPS,
} from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/controlsFormValues';
import { TypeCurveFitDataContext } from '@/type-curves/TypeCurveFit/TypeCurveFitDataContext';

import { setRangeValues } from './useAutoFitForm';

const NumberRangeFieldLabelStyles = {
	fontSize: '0.8rem',
	flexBasis: '30%',
};

const defaultCheck = (value) => value;

const PROXIMITY_ACTION_BUTTON_WIDTH = 10;
const FILTERED_WELLS_TOOLTIP_MESSAGE = 'All wells have been excluded';

const sanitizeFormValues = (formValues) => {
	const vals = produce(formValues, (draft) => {
		draft['buildup']['apply'] = draft['TC_model'] === 'flat_arps_modified' ? false : draft['buildup']['apply'];
		draft['buildup']['days'] = round(draft['buildup']['days']);
		draft['minus_t_elf_t_peak'] = draft['minus_t_elf_t_peak'].map(round);
		draft['minus_t_peak_t0'] = draft['minus_t_peak_t0'].map(round);
		draft['p1_range'] = draft['p1_range'].map(round);
	});
	return vals;
};

const AutoFit = forwardRef(
	(
		{
			canUpdateTypeCurve,
			defaultFormConfig,
			formikBundle,
			handleApplyToTargetWell,
			handleAutoFit,
			isProximity,
			saveTypeCurve,
			setPhase,
			validateForm,
		},
		ref
	) => {
		const {
			align,
			activeFormConfig,
			basePhase,
			basePhaseSeries,
			dailyRange,
			dailyRangeMinMax,
			eurs,
			eurPercentile,
			fit,
			fitEdited,
			fitInit,
			fitSeries,
			formConfigDialog,
			normalize,
			noWells,
			percentileFit,
			phase,
			phaseType,
			resolution,
			hasRun,
			requiredMinMax,
			setHasRun,
			setAlign,
			setDailyRange,
			setEurPercentile,
			setNormalize,
			setPeakMethod,
			setResolution,
			showFormConfigDialog,
			tcFits,
			selection,
		} = useContext(TypeCurveFitDataContext);

		const [localDailyMin, setLocalDailyMin] = useDerivedState(dailyRange[align][0]);
		const [localDailyMax, setLocalDailyMax] = useDerivedState(dailyRange[align][1]);

		const availableModels = useMemo(() => {
			// Temporarily added because Proximity shouldn't have the Flat + M Arps model
			const excludedModels = isProximity ? [] : [];

			return TC_MODELS?.[phaseType].filter((x) => !excludedModels.includes(x?.value));
		}, [isProximity, phaseType]);

		const { values, setValues, isValid } = formikBundle;
		setPeakMethod(values.best_fit_q_peak.method);

		const submitForm = useCallback(() => {
			if (handleAutoFit) {
				const sanitizedValues = sanitizeFormValues(values);
				setHasRun(true);
				setValues(sanitizedValues);
				handleAutoFit(sanitizedValues);
			}
		}, [handleAutoFit, values, setHasRun, setValues]);

		const { params = {}, viewOrder = [] } = useMemo(
			() => formTemplates[phaseType][values.TC_model] ?? {},
			[phaseType, values.TC_model]
		);

		const openConfigDialog = useCallback(
			(e) => {
				e.stopPropagation();
				showFormConfigDialog(
					{ settings: values, phaseType, align, normalize, resolution, eurPercentile },
					isValid
				);
			},
			[align, eurPercentile, normalize, phaseType, resolution, showFormConfigDialog, values, isValid]
		);

		const fieldHasSavedDefault = useCallback(
			(fieldKey, validCheck = defaultCheck) => {
				const defaultConfigValue = get(defaultFormConfig.settings, fieldKey);
				const savedSettingsValue = get(fit?.settings ?? {}, fieldKey);

				return validCheck(defaultConfigValue) || validCheck(savedSettingsValue);
			},
			[defaultFormConfig, fit?.settings]
		);

		const applyDailyRange = useCallback(() => {
			const { min, max } = dailyRangeMinMax.minMax;

			// "" becomes 0, integers only
			let newMin = Math.max(min, Math.round(localDailyMin));
			let newMax = Math.min(max, Math.round(localDailyMax));

			if (newMin > newMax && newMax > min) {
				newMin = newMax - 1;
			} else if (newMax < newMin && newMin < max) {
				newMax = newMin + 1;
			}

			setDailyRange(
				produce((draft) => {
					draft[align] = [newMin, newMax];
				})
			);
		}, [align, dailyRangeMinMax.minMax, localDailyMax, localDailyMin, setDailyRange]);

		const handleSave = useCallback(() => saveTypeCurve({ inputSettings: values }), [saveTypeCurve, values]);

		useImperativeHandle(ref, () => ({ save: handleSave }));

		const applyDefaults = useCallbackRef(() => {
			const valuesToSet = {};

			// not sure if if statements are required
			if (!fieldHasSavedDefault('p1_range')) {
				setRangeValues(activeFormConfig?.settings, valuesToSet, requiredMinMax, 'p1_range');
			}
			if (!fieldHasSavedDefault('addSeriesFitRange')) {
				setRangeValues(activeFormConfig?.settings, valuesToSet, requiredMinMax, 'addSeriesFitRange');
			}
			if (!fieldHasSavedDefault('best_fit_q_peak.range')) {
				setRangeValues(activeFormConfig?.settings, valuesToSet, requiredMinMax, 'best_fit_q_peak.range');
			}

			if (Object.keys(valuesToSet).length) {
				setValues(produce((draft) => deepMerge(draft, valuesToSet)));
				setTimeout(validateForm, 250);
			}
		}, []);

		useEffect(applyDefaults, [applyDefaults, requiredMinMax]);

		useEffect(() => {
			if (values.TC_model === 'flat_arps_modified') {
				setAlign(false);
			}
		}, [setAlign, values.TC_model]);

		const alignPeaksTooltip = useMemo(() => {
			if (phaseType === 'ratio') {
				return 'Align is unavailable for ratio phase';
			} else if (values.TC_model === 'flat_arps_modified') {
				return 'Align is unavailable for Flat + M Arps model';
			} else {
				return TOOLTIPS.align;
			}
		}, [phaseType, values.TC_model]);

		const viewParamsProps = {
			basePhase,
			baseSegments: tcFits?.[basePhase]?.[basePhaseSeries]?.segments ?? [],
			forecastType: phaseType,
			idxDate: true,
			passedEurs: eurs,
			pDict: fitSeries,
			phase,
			setPhase,
			type: 'probabilistic',
			phaseTypes: fitInit?.phaseType,
		};

		// TODO: Separate out into additional component due to additional validation logic
		const renderBuildup = useMemo(
			() =>
				phaseType === 'rate' && (
					<>
						<Box display='flex' alignItems='center' justifyContent='space-between' minHeight='3.25rem'>
							<Box flexBasis='60%'>
								<TCTooltippedField tooltip={TOOLTIPS.buildup.apply}>
									<SwitchField
										label={`${values.buildup.apply ? 'Manual' : 'Automatic'} Buildup`}
										name='buildup.apply'
										{...SHARED_SWITCH_PROPS}
									/>
								</TCTooltippedField>
							</Box>

							{Boolean(values.buildup.apply) && (
								<Box flexBasis='40%'>
									<TCTooltippedField tooltip={TOOLTIPS.buildup.days}>
										<TextField
											blurOnEnter
											label='Days'
											name='buildup.days'
											type='number'
											validate={getValidateFn({
												min: 0,
												required: values.buildup.apply,
												type: 'number',
												isInteger: true,
											})}
										/>
									</TCTooltippedField>
								</Box>
							)}
						</Box>

						{Boolean(values.buildup.apply) && (
							<Box display='flex' alignItems='center' justifyContent='space-between' minHeight='3.25rem'>
								<Box flexBasis='60%'>
									<TCTooltippedField tooltip={TOOLTIPS.buildup.apply_ratio}>
										<SwitchField
											label={`${values.buildup.apply_ratio ? 'Manual' : 'Automatic'} Ratio`}
											name='buildup.apply_ratio'
											{...SHARED_SWITCH_PROPS}
										/>
									</TCTooltippedField>
								</Box>

								{Boolean(values.buildup.apply_ratio) && (
									<Box flexBasis='40%'>
										<TCTooltippedField tooltip={TOOLTIPS.buildup.buildup_ratio}>
											<TextField
												blurOnEnter
												disabled={!values.buildup.apply_ratio}
												label='Ratio'
												name='buildup.buildup_ratio'
												type='number'
												validate={getValidateFn({
													min: 1e-5,
													max: 1,
													required: values.buildup.apply_ratio,
													type: 'number',
												})}
											/>
										</TCTooltippedField>
									</Box>
								)}
							</Box>
						)}
					</>
				),
			[phaseType, values.buildup.apply, values.buildup.apply_ratio]
		);

		const isProximityRunButtonDisabled =
			isProximity &&
			((!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) ||
				noWells ||
				(!selection.filteredArray?.length && FILTERED_WELLS_TOOLTIP_MESSAGE) ||
				!isValid);

		return (
			<FormikContext.Provider value={formikBundle}>
				<FormContainer isProximity={isProximity}>
					{!isProximity && (
						<>
							<ActionsContainer>
								<Button
									color='primary'
									disabled={(!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) || !fitEdited}
									onClick={handleSave}
									size='small'
								>
									Save
								</Button>

								<Button
									color='secondary'
									disabled={
										(!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) || noWells || !isValid
									}
									onClick={submitForm}
									size='small'
								>
									Run
								</Button>

								<Box>
									<IconButton
										color='primary'
										onClick={openConfigDialog}
										disabled={!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE}
										size='small'
										tooltipTitle='Open Form Configuration Dialog'
									>
										{faUserCog}
									</IconButton>
								</Box>
							</ActionsContainer>
							<Divider />
						</>
					)}

					{!isProximity && (
						<PhaseSelectField
							onChange={setPhase}
							value={phase}
							phaseTypes={fitInit?.phaseType}
							basePhase={basePhase}
						/>
					)}

					{!isProximity && (
						<SimpleSwitchField
							checked={align === 'align'}
							disabled={phaseType === 'ratio' || values.TC_model === 'flat_arps_modified'}
							label='Align Peaks'
							name='align'
							onChange={(ev) => setAlign(ev.target.checked)}
							tooltip={alignPeaksTooltip}
						/>
					)}

					<SimpleSwitchField
						checked={normalize}
						disabled={phaseType === 'ratio'}
						label='Normalize'
						name='normalize'
						onChange={(ev) => setNormalize(ev.target.checked)}
						tooltip={TOOLTIPS.normalize}
					/>
					{!isProximity && (
						<SimpleSwitchField
							checked={eurPercentile}
							disabled={!(percentileFit && phaseType === 'rate')}
							label='Match Analog Well Set EUR'
							name='matchEur'
							onChange={(ev) => setEurPercentile(ev.target.checked)}
							tooltip={TOOLTIPS.eurPercentile}
						/>
					)}
					{!isProximity && (
						<SimpleSwitchField
							checked={resolution === 'daily'}
							label='Daily Resolution'
							name='resolution'
							onChange={(ev) => setResolution(ev.target.checked)}
							tooltip={TOOLTIPS.resolution}
						/>
					)}

					{resolution === 'daily' && (
						<Box css='& > *:not(:first-child) { margin-left: 1rem }' display='flex' alignItems='center'>
							<Box css={NumberRangeFieldLabelStyles}>Daily Range</Box>

							<MUITextField
								blurOnEnter
								label={dailyRangeMinMax.minMax.startLabel}
								onBlur={applyDailyRange}
								onChange={(ev) => setLocalDailyMin(ev.target.value)}
								type='number'
								value={localDailyMin}
							/>

							<MUITextField
								blurOnEnter
								label={dailyRangeMinMax.minMax.endLabel}
								onBlur={applyDailyRange}
								onChange={(ev) => setLocalDailyMax(ev.target.value)}
								type='number'
								value={localDailyMax}
							/>
						</Box>
					)}

					<Divider />

					<SimpleSelectField label='Multi-Segment Fit Type' menuItems={availableModels} name='TC_model' />

					{viewOrder.map((param) => {
						const {
							dif,
							isInteger,
							label,
							max,
							min,
							requiresUnitTransform,
							tooltip,
							type,
							units: paramUnits,
						} = params[param];

						const inputProps = {
							dif,
							max: max ?? Number.POSITIVE_INFINITY,
							min: min ?? Number.NEGATIVE_INFINITY,
							name: param,
							required: true,
						};

						const units = requiresUnitTransform
							? defaultUnitTemplate[phaseType === 'rate' ? phase : `${phase}/${basePhase}`]
							: paramUnits;

						if (type === 'range') {
							return (
								<TCTooltippedField key={label} tooltip={tooltip}>
									<NumberRangeField
										{...inputProps}
										isInteger={isInteger}
										fieldLabel={labelWithUnit(label, units)}
										fieldLabelStyles={NumberRangeFieldLabelStyles}
										onBlur={formikBundle.handleBlur}
									/>
								</TCTooltippedField>
							);
						}
						if (type === 'number') {
							return (
								<TCTooltippedField key={label} tooltip={tooltip}>
									<TextField
										{...inputProps}
										blurOnEnter
										fullWidth
										label={labelWithUnit(label, units)}
										type='number'
										validate={getValidateFn({ ...inputProps, isInteger, type: 'number' })}
									/>
								</TCTooltippedField>
							);
						}

						return null;
					})}

					{phaseType === 'rate' && (
						<TCTooltippedField tooltip={TOOLTIPS.q_final}>
							<TextField
								blurOnEnter
								label={labelWithUnit(
									'q Final',
									defaultUnitTemplate[phaseType === 'rate' ? phase : `${phase}/${basePhase}`]
								)}
								name='q_final'
								type='number'
								validate={getValidateFn({ min: 0, required: true, type: 'number' })}
							/>
						</TCTooltippedField>
					)}

					<TCTooltippedField tooltip={TOOLTIPS.well_life}>
						<TextField
							blurOnEnter
							fullWidth
							label={labelWithUnit('Well Life', 'years')}
							min={1}
							max={100}
							name='well_life'
							required
							type='number'
							validate={getValidateFn({ min: 0, required: true, type: 'number' })}
						/>
					</TCTooltippedField>

					{values.TC_model !== 'flat_arps_modified' && renderBuildup}

					{!isProximity && (
						<SimpleSelectField
							fullWidth
							label='Best Fit Options'
							menuItems={ADD_SERIES_MENU_OPTIONS[phaseType]}
							name='addSeries'
						/>
					)}

					{['collect_prod', 'collect_cum'].includes(values.addSeries) && (
						<>
							<TCTooltippedField tooltip={TOOLTIPS.best_fit_q_peak.addSeriesFitRange}>
								<Box display='flex' justifyContent='space-between'>
									<Box paddingRight='0.25rem'>
										<DatePicker label='Start Date' name='addSeriesFitRange.0' />
									</Box>

									<Box paddingLeft='0.25rem'>
										<DatePicker label='End Date' name='addSeriesFitRange.1' />
									</Box>
								</Box>
							</TCTooltippedField>

							<TCTooltippedField tooltip={TOOLTIPS.best_fit_q_peak.method}>
								<SimpleSelectField
									fullWidth
									label='Best Fit q Peak'
									menuItems={BEST_FIT_Q_PEAK_MENU_OPTIONS}
									name='best_fit_q_peak.method'
								/>
							</TCTooltippedField>

							{['absolute_range', 'percentile_range'].includes(values.best_fit_q_peak.method) && (
								<NumberRangeField
									fieldLabel='Best Fit q Peak Range'
									fieldLabelStyles={NumberRangeFieldLabelStyles}
									name='best_fit_q_peak.range'
									required
								/>
							)}
						</>
					)}

					<NumberRangeField
						name='p1_range'
						fieldLabel='P-Series Fit Range (Days)'
						fieldLabelStyles={NumberRangeFieldLabelStyles}
						enforceMinMaxOnBlur
						isInteger
						{...requiredMinMax.p1_range}
					/>
					<Divider />

					{isProximity && values.TC_model === 'flat_arps_modified' && (
						<TCTooltippedField tooltip={TOOLTIPS.flatPeriodRate}>
							<TextField
								blurOnEnter
								fullWidth
								label={labelWithUnit('Flat period rate', defaultUnitTemplate[phase])}
								min={0.01}
								max={1000000}
								name='q_flat'
								required
								type='number'
								validate={getValidateFn({ min: 0, required: true, type: 'number' })}
							/>
						</TCTooltippedField>
					)}

					{isProximity && (
						<>
							<TCTooltippedField tooltip={TOOLTIPS.applySeries}>
								<SimpleSelectField
									fullWidth
									label='Apply Series to Target Well'
									menuItems={[
										{ value: 'average', label: 'Best Fit' },
										{ value: 'P10', label: 'P10' },
										{ value: 'P50', label: 'P50' },
										{ value: 'P90', label: 'P90' },
									]}
									name='applySeries'
								/>
							</TCTooltippedField>
							<br />
							<TCTooltippedField tooltip={TOOLTIPS.fitToTargetData}>
								<SwitchField
									label='Fit to target well production data'
									name='fitToTargetData'
									{...SHARED_SWITCH_PROPS}
								/>
							</TCTooltippedField>
						</>
					)}
					{!isProximity && <ParametersDescriptionWithFloater {...viewParamsProps} />}
					{isProximity && (
						<Box
							display='flex'
							justifyContent='flex-end'
							borderTop={`1px solid ${theme.borderColor}`}
							pb={1}
							pt={2}
							mt={isProximity ? 'auto' : undefined}
							width='100%'
						>
							<Button
								variant='outlined'
								color='secondary'
								css={`
									width: ${PROXIMITY_ACTION_BUTTON_WIDTH}rem;
								`}
								disabled={isProximityRunButtonDisabled}
								onClick={submitForm}
								{...getTaggingProp('forecast', 'editingProximityRunFit')}
							>
								Run
							</Button>
							<Button
								variant='outlined'
								color='secondary'
								css={`
									margin-left: 4px;
									width: ${PROXIMITY_ACTION_BUTTON_WIDTH}rem;
								`}
								disabled={!hasRun && 'Cannot apply fit to target well until fit has been "Run"'}
								onClick={() => handleApplyToTargetWell()}
								{...getTaggingProp('forecast', 'editingProximityApplyFit')}
							>
								Apply
							</Button>
							<Button
								variant='outlined'
								color='secondary'
								css={`
									margin-left: 4px;
									width: ${PROXIMITY_ACTION_BUTTON_WIDTH}rem;
								`}
								disabled={!hasRun && 'Cannot apply fit to target well until fit has been "Run"'}
								onClick={() => handleApplyToTargetWell(true)}
								{...getTaggingProp('forecast', 'editingProximityApplySaveFit')}
							>
								Apply & Save
							</Button>
						</Box>
					)}
				</FormContainer>

				{formConfigDialog}
			</FormikContext.Provider>
		);
	}
);

export default AutoFit;
