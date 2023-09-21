import { faQuestion, faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { FormikContext } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';

import { FormikCheckbox, Toolbar } from '@/components';
import { useHotkey } from '@/components/hooks/useHotkey';
import { TooltipedLabel } from '@/components/tooltipped';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@/components/v2';
import { TooltipWrapper } from '@/components/v2/helpers';
import { InstructionsBanner } from '@/data-import/FileImport/CreateDialog';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { postApi } from '@/helpers/routing';
import { phases } from '@/helpers/zing';
import useZoho, { ZOHO_ARTICLE_IDS } from '@/knowledge-base/useZoho';
import { SectionAIO } from '@/layouts/Section';

import { GeneralForm } from './GeneralForm';
import { PhaseForm } from './PhaseForm';
import { useForecastForm } from './shared';

const PhaseContainer = styled.div`
	display: flex;
	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
`;

const Footer = styled.div`
	display: flex;
`;

const BAYESIAN_MODELS = [
	'arps_fulford',
	'arps_modified_fulford',
	'arps_linear_flow_fulford',
	'arps_modified_fp_fulford',
];

export const checkBayesian = (values, isReforecast = false) => {
	// On initial load of screen, values is empty
	if (Object.keys(values).length === 0) {
		return false;
	}

	if (!isReforecast && values.applyAll) {
		return BAYESIAN_MODELS.includes(values.shared.model_name);
	}
	const keys = VALID_PHASES;
	for (let i = 0; i < keys.length; i++) {
		if (BAYESIAN_MODELS.includes(values[keys[i]].model_name)) {
			return true;
		}
	}
	return false;
};

export const ForecastForm = ({
	activeConfigKey: parentActiveConfigKey = null,
	disablePhaseFilter = false,
	forecastId,
	forecastType = 'probabilistic',
	formValues: parentFormValues = null,
	rateOnly = false,
	reject,
	resolve,
	runText = null,
	wells,
	visible,
	...props
}) => {
	const runPropsRef = useRef({});

	const { refetch: runAutoForecastApi, isFetching: runningAutoForecast } = useQuery(
		['forecast', 'auto-forecast', forecastId],
		async () => {
			const { adjustedSettings, formProps } = runPropsRef.current;
			const body = { auto: adjustedSettings, wells, scope: ['auto'] };
			try {
				const { createdTask, task, ranForecast } = await postApi(
					`/forecast/${forecastId}/autoFullForecast`,
					body
				);
				resolve({ createdTask, taskId: task, ranForecast, formProps });
			} catch (error) {
				reject(error);
			}
		},
		{ enabled: false }
	);

	const handleAutoForecast = (adjustedSettings, formProps) => {
		runPropsRef.current = { adjustedSettings, formProps };
		runAutoForecastApi();
	};

	const {
		activeConfigKey,
		configDialog,
		confirmDialog,
		formikBundle,
		getValues,
		setActiveConfigKey,
		showConfigDialog: _showConfigDialog,
	} = useForecastForm({
		enforceRatioCheck: true,
		forecastId,
		forecastType,
		onSubmit: handleAutoForecast,
	});
	const { setValues, values, isSubmitting, submitForm, setFieldValue, validateForm } = formikBundle;

	const handleCancel = () => resolve({ formProps: { values: getValues(), activeConfigKey } });

	const showConfigDialog = () => {
		const resolution = getValues().shared.resolution;
		_showConfigDialog(resolution);
	};

	const sharedProps = {
		rateOnly,
		forecastType,
	};

	const [showNinja_, setShowNinja] = useState(false);
	const showNinja = showNinja_ && values.advanced;

	// HACK for some reason formik validations are getting out of hands, this whole dialog needs a refactoring
	useEffect(() => {
		if (!values.shared) {
			return () => {
				// Values is empty on the first load of page.
			};
		}
		const timeout = setTimeout(() => {
			setFieldValue('shared.model_name', values.shared?.model_name);
		}, 10);
		return () => clearTimeout(timeout);
	}, [
		values.shared,
		values.shared?.model_name,
		values.oil?.model_name,
		values.gas?.model_name,
		values.water?.model_name,
		setFieldValue,
	]);

	// HACK: re-run validation outside the event loop when the dialog is made visible
	useEffect(() => {
		if (visible) {
			setTimeout(() => validateForm());
		}
	}, [visible, validateForm]);

	// HACK: re-run validation when b changes since b Prior bounds depend on it.
	useEffect(() => {
		setTimeout(() => validateForm());
	}, [
		values?.shared?.b,
		values?.shared?.b2,
		values?.oil?.b,
		values?.oil?.b2,
		values?.gas?.b,
		values?.gas?.b2,
		values?.water?.b,
		values?.water?.b2,
		validateForm,
	]);

	useEffect(() => {
		if (parentActiveConfigKey) {
			setActiveConfigKey(parentActiveConfigKey);
		}
		if (parentFormValues) {
			setValues(parentFormValues);
		}
	}, [parentActiveConfigKey, parentFormValues, setActiveConfigKey, setValues]);

	useHotkey('shift+alt+x', () => setShowNinja((p) => !p));

	const { openArticle } = useZoho();
	return (
		<FormikContext.Provider value={formikBundle}>
			<Dialog onClose={handleCancel} maxWidth={values.applyAll ? 'md' : 'xl'} fullWidth open={visible} {...props}>
				<DialogTitle>
					<Toolbar
						left='Automatic Forecast Settings'
						right={
							<>
								<IconButton
									color='primary'
									disabled={
										(!formikBundle.isValid && 'Fix errors before adjusting configurations') ||
										runningAutoForecast
									}
									onClick={showConfigDialog}
									size='small'
									tooltipTitle='Settings Configurations'
								>
									{faUserCog}
								</IconButton>
								<IconButton
									onClick={() =>
										openArticle({ articleId: ZOHO_ARTICLE_IDS.DeterministicForecastSetttings })
									}
									tooltipTitle='Help'
									size='small'
								>
									{faQuestion}
								</IconButton>
							</>
						}
					/>
				</DialogTitle>
				<DialogContent>
					<SectionAIO
						header={<GeneralForm {...sharedProps} includePhases />}
						footer={
							<Footer>
								<FormikCheckbox label='Apply To All Phases' name='applyAll' plain />
								<TooltipWrapper
									tooltipTitle={
										!formikBundle.isValid ? 'Fix errors before toggling advanced options' : ''
									}
								>
									<div>
										<FormikCheckbox
											name='advanced'
											label='Advanced Options'
											plain
											disabled={!formikBundle.isValid}
											tooltipLabel={!formikBundle.isValid}
										/>
									</div>
								</TooltipWrapper>
								<FormikCheckbox
									name='shared.overwrite_manual'
									label={
										<TooltipedLabel labelTooltip='Uncheck to retain saved manual forecasts (i.e., auto forecast will not overwrite manual forecasts)'>
											Overwrite Manual
										</TooltipedLabel>
									}
									plain
								/>
								{showNinja && (
									<FormikCheckbox
										name='ninja.enforce_same_peak'
										label='Enforce same peak as the main phase'
										plain
									/>
								)}
							</Footer>
						}
					>
						{values.applyAll ? (
							<PhaseForm
								{...sharedProps}
								phase='shared'
								disableFilter={disablePhaseFilter}
								showType
								showModel
								showNinja={showNinja}
							/>
						) : (
							<PhaseContainer>
								{phases.map(({ value }) => (
									<PhaseForm
										key={value}
										{...sharedProps}
										phase={value}
										disablePhaseFilter={disablePhaseFilter}
										readOnly={!values.phases?.[value]}
										showType
										showModel
										showNinja={showNinja}
									/>
								))}
							</PhaseContainer>
						)}
						{checkBayesian(values) && (
							<InstructionsBanner
								onClick={() => openArticle({ articleId: ZOHO_ARTICLE_IDS.BayesianInfo })}
							>
								Learn more about the new Bayesian forecast models!
							</InstructionsBanner>
						)}
					</SectionAIO>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancel} color='warning' key='close'>
						Close
					</Button>
					<Button
						disabled={
							wells.length < 1 ||
							!VALID_PHASES.find((p) => values.phases?.[p]) ||
							isSubmitting ||
							runningAutoForecast ||
							!formikBundle.isValid
						}
						onClick={submitForm}
						color='primary'
						key='submit'
					>
						{runText ?? `Run (${wells.length})`}
					</Button>
				</DialogActions>
			</Dialog>
			{configDialog}
			{confirmDialog}
		</FormikContext.Provider>
	);
};
