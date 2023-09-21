/* eslint react/jsx-key: warn */
import { faExpand, faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { faCompress } from '@fortawesome/pro-solid-svg-icons';
import produce from 'immer';
import _, { get, noop, set, truncate } from 'lodash';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { useCallbackRef } from '@/components/hooks';
import {
	Box,
	Divider,
	FormControlLabel,
	IconButton,
	MenuIconButton,
	MenuItem,
	CheckboxField as MuiCheckboxField,
	RHFForm,
	Radio,
	Tab,
	Tabs,
} from '@/components/v2';
import { CLOSE_ATTR_NAME } from '@/components/v2/menu/shared';
import ForecastFloater from '@/forecasts/shared/ForecastFloater';
import PhaseRadioSelection from '@/forecasts/shared/PhaseRadioSelection';
import { genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import { ifProp, theme } from '@/helpers/styled';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/forecast_forms.json';

import { VALID_PHASES } from '../charts/components/graphProperties';
import { Configuration } from '../configurations/configurations';
import { ForecastToolbarTheme } from '../deterministic/layout';
import ForecastFormControl, { FormControlRangeField } from './ForecastFormControl';
import { getEnabledPhases } from './ForecastFormV2';
import { ForecastFormResolution, Phase } from './automatic-form/types';
import { UseAutomaticForecastReturn } from './automatic-form/useAutomaticForecast';
import { UseForecastFormConfigurationReturn } from './useForecastFormConfiguration';

const FormContainer = styled(Box)`
	display: flex;
	flex-direction: column;
	width: 100%;
	${ifProp('hidden', 'display: none')}
`;

const FormRow = styled.section`
	align-items: center;
	column-gap: 0.5rem;
	display: flex;
	justify-content: space-between;
	margin-top: 0.5rem;
	min-height: 3rem;
	width: 100%;
`;

const HANDLE_ID = 'edit-form-handle';

const DISABLED_FIELD_MESSAGE = 'This field is unvailable for the current model';

// needed to align elements as checkboxes on the left or right edges are padded beyond the container boundary
const CHECKBOX_PADDING = '-9px';

const QuickEditForm = forwardRef<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	Record<string, any>,
	{
		automaticForecastProps: UseAutomaticForecastReturn;
		configurationProps: UseForecastFormConfigurationReturn;
		forecastId: string;
		resolution: ForecastFormResolution;
		showForecastForm: () => void;
		visible: boolean;
	}
>(({ automaticForecastProps, configurationProps, forecastId, resolution, showForecastForm, visible }, ref) => {
	const [collapsed, setCollapsed] = useState<boolean>(false);
	const [phase, setPhase] = useState<Phase>('oil');

	const { form, getSubmissionBody } = automaticForecastProps;
	const { activeConfigKey, configs: allConfigs, selectConfig } = configurationProps;
	const configs: Record<string, Configuration> = useMemo(() => {
		const { configurations } = allConfigs ?? {};
		if (configurations) {
			return _.reduce(
				configurations,
				(acc, config, key) => {
					if (config?.configuration?.forecastScope?.auto) {
						acc[key] = config;
					}
					return acc;
				},
				{}
			);
		}

		return {};
	}, [allConfigs]);

	const { getValues, reset, watch } = form;
	const [applyAll, formPhases] = watch(['applyAll', 'phases']);

	const phaseKey = useMemo(() => (applyAll ? 'shared' : phase), [applyAll, phase]);

	const [curAxisCombo, curModelName, phaseEurMatchType] = watch([
		`${phaseKey}.axis_combo`,
		`${phaseKey}.model_name`,
		`${phaseKey}.match_eur.match_type`,
	]);

	const enabledPhases = useMemo(() => getEnabledPhases(formPhases), [formPhases]);

	const { mutateAsync: handleAutoForecast, isLoading: isSubmitting } = useMutation(
		async ({ wellId, inputDates, callback }: { wellId; inputDates; callback }) => {
			const values = getSubmissionBody();

			// adjust for the inputDates
			const adjustedSettings = produce(values, (draft) => {
				enabledPhases.forEach((curPhase) => {
					draft[curPhase] ??= { time_dict: {} };
					draft[curPhase].time_dict.mode = 'absolute_range';
					draft[curPhase].time_dict.absolute_range = inputDates;
				});
			});

			try {
				await withLoadingBar(
					postApi(`/forecast/${forecastId}/autoFullForecast`, {
						auto: adjustedSettings,
						scope: ['auto'],
						resolution,
						wells: [wellId],
					})
				);
				callback?.();
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	);

	const haveValidConfigs = _.keys(configs).length;
	const configMenuItems = useMemo(
		() =>
			haveValidConfigs
				? _.map(configs, (value, key) => ({
						...value.configuration,
						name: value?.name,
						_key: key,
				  }))
				: [],
		[configs, haveValidConfigs]
	);

	const validEurMatch = useMemo(
		() =>
			curAxisCombo === 'rate' &&
			[
				'arps_modified_wp',
				'arps_modified_free_peak',
				'arps_modified_fulford',
				'arps_modified_fp_fulford',
			].includes(curModelName),
		[curAxisCombo, curModelName]
	);

	const eurMatchEnabled = useMemo(
		() => phaseEurMatchType === 'forecast' && validEurMatch,
		[phaseEurMatchType, validEurMatch]
	);

	const eurTextFieldDisabled = useMemo(() => {
		if (!validEurMatch) {
			return DISABLED_FIELD_MESSAGE;
		}
		if (!eurMatchEnabled) {
			return 'Enable EUR Match to edit';
		}
		return undefined;
	}, [eurMatchEnabled, validEurMatch]);

	const template = useMemo(() => formTemplates?.[curAxisCombo]?.[curModelName] ?? {}, [curAxisCombo, curModelName]);
	const { viewOrder = [], params = {} } = template;

	const bKey = useMemo(() => (curModelName === 'segment_arps_4_wp' ? 'b2' : 'b'), [curModelName]);
	const dEffKey = useMemo(() => (curModelName === 'segment_arps_4_wp' ? 'D1_eff' : 'D_eff'), [curModelName]);

	const bRequired = viewOrder.includes(bKey);
	const dEffRequired = viewOrder.includes(dEffKey);

	const setEnabledPhases = useCallbackRef((applySet) => {
		const curValues = getValues();
		const phaseArr = applySet(enabledPhases);
		reset(
			produce(curValues, (draft) => {
				phaseArr.forEach((curPhase) => {
					draft.phases[curPhase] = true;
				});

				_.difference(VALID_PHASES, phaseArr).forEach((curPhase) => {
					draft.phases[curPhase] = false;
				});
			})
		);
	});

	const toggleEurCheckbox = useCallbackRef(() => {
		const curValues = getValues();
		reset(
			produce(curValues, (draft) => {
				const basePath = `${phaseKey}.match_eur`;
				const curValue = get(draft, `${basePath}.match_type`);
				set(draft, `${basePath}.match_type`, curValue === 'forecast' ? 'no_match' : 'forecast');
				if (curValue !== 'forecast') {
					set(draft, `${basePath}.match_forecast_id`, forecastId);
				}
			})
		);
	});

	useImperativeHandle(ref, () => ({
		handleQuickEditForecast: handleAutoForecast,
	}));

	return (
		<ForecastFloater
			borderColor={theme?.[`${phaseKey}Color`] ?? null}
			detached
			disableToolbar
			enablePositionHotkey
			handle={HANDLE_ID}
			leftStart='70%'
			minimal
			onToggle={noop}
			topStart='15%'
			visible={visible}
			width='17.5rem'
		>
			<RHFForm form={form}>
				<FormContainer>
					<ForecastToolbarTheme>
						<Box
							alignItems='center'
							display='flex'
							fontWeight='800'
							justifyContent='space-between'
							marginX={CHECKBOX_PADDING}
						>
							<PhaseRadioSelection
								enableLabels={false}
								generateRadioTooltip={(checked, label) =>
									`${
										checked ? 'Deactivate' : 'Activate'
									} ${label} Phase when Rapid Forecast is Applied`
								}
								phases={enabledPhases}
								row
								setPhases={setEnabledPhases}
								size='small'
								tooltipPlacement='top'
							/>

							<div
								id={HANDLE_ID}
								css={`
									align-self: stretch;
									cursor: grab;
									display: flex;
									flex-grow: 1;
									&:active {
										cursor: grabbing;
									}
								`}
							/>

							<IconButton onClick={() => setCollapsed((p) => !p)} size='small'>
								{collapsed ? faExpand : faCompress}
							</IconButton>

							<MenuIconButton
								disabled={isSubmitting}
								disablePortal={false}
								icon={faUserCog}
								popperPlacement='right-start'
								size='small'
								tooltipTitle='View configurations'
							>
								{showForecastForm && (
									<>
										<MenuItem onClick={showForecastForm} {...{ [CLOSE_ATTR_NAME]: true }}>
											Run Auto Forecast Form
										</MenuItem>
										<Divider />
									</>
								)}

								<MenuItem
									css={`
										font-size: 0.75rem;
									`}
									disabled
								>
									{haveValidConfigs ? 'Saved Configurations' : 'No configurations available'}
								</MenuItem>
								{configMenuItems.map((item) => (
									<MenuItem key={item._key} onClick={() => selectConfig(item)} title={item?.name}>
										<FormControlLabel
											control={
												<Radio
													checked={item._key === activeConfigKey}
													size='small'
													value={item._key === activeConfigKey}
												/>
											}
											label={truncate(item?.name, { length: 30 })}
										/>
									</MenuItem>
								))}
							</MenuIconButton>
						</Box>

						<FormContainer hidden={collapsed}>
							<Divider />

							<Box
								alignItems='center'
								display='flex'
								justifyContent='space-between'
								marginLeft={CHECKBOX_PADDING}
							>
								<Tabs
									indicatorColor='secondary'
									onChange={(_ev, newValue) => setPhase(newValue)}
									textColor='secondary'
									value={phaseKey}
								>
									{[
										{ value: 'oil', label: 'O' },
										{ value: 'gas', label: 'G' },
										{ value: 'water', label: 'W' },
										{ value: 'shared', label: 'S' },
									].map(({ value, label }) => (
										<Tab
											css={`
												min-width: unset;

												// matches the width of the radio selection
												width: 38px;

												// HACK: gets the tabs to play nice with a value that isn't there
												display: ${value === 'shared' && 'none'};
											`}
											disabled={applyAll}
											key={`quick-phase-selection__${value}`}
											label={label}
											value={value}
										/>
									))}
								</Tabs>

								<ForecastFormControl inForm={false} label='All Phases' name='applyAll' type='boolean' />
							</Box>

							<Divider />

							{/* @TODO: get together with forecast-ds to see if we can keep the var names the same; otherwise create a template for b factor and d_eff */}
							<FormRow>
								<FormControlRangeField
									dif={params?.[bKey]?.dif}
									disabled={!bRequired}
									endLabel='Max'
									label='b'
									max={params?.[bKey]?.max}
									min={params?.[bKey]?.min}
									name={`${phaseKey}.${bKey}`}
									required={bRequired}
									startLabel='Min'
									type='number'
								/>
							</FormRow>

							<FormRow>
								<FormControlRangeField
									dif={params?.[dEffKey]?.dif}
									disabled={!dEffRequired}
									endLabel='Max'
									label='Di (%)'
									max={params?.[dEffKey]?.max}
									min={params?.[dEffKey]?.min}
									name={`${phaseKey}.${dEffKey}`}
									required={dEffRequired}
									startLabel='Min'
									type='number'
								/>
							</FormRow>

							<FormRow>
								<MuiCheckboxField
									checked={eurMatchEnabled}
									css='margin-right: unset;'
									disabled={!validEurMatch}
									label='Match EUR'
									onChange={toggleEurCheckbox}
									size='small'
									value={eurMatchEnabled}
								/>

								<ForecastFormControl
									disabled={!(validEurMatch && eurMatchEnabled)}
									label='Delta %'
									name={`${phaseKey}.match_eur.match_percent_change`}
									tooltip={eurTextFieldDisabled}
									type='number'
								/>

								<ForecastFormControl
									disabled={!(validEurMatch && eurMatchEnabled)}
									label='Tol %'
									name={`${phaseKey}.match_eur.error_percentage`}
									tooltip={eurTextFieldDisabled}
									type='number'
								/>
							</FormRow>
						</FormContainer>
					</ForecastToolbarTheme>
				</FormContainer>
			</RHFForm>
		</ForecastFloater>
	);
});

export default QuickEditForm;
