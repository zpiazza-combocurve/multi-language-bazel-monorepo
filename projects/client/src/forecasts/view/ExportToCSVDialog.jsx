import { faChevronDown, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { Accordion, AccordionDetails, AccordionSummary } from '@material-ui/core';
import { Field, Formik } from 'formik';
import { omitBy, pick } from 'lodash-es';
import { useCallback, useContext, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';

import { FormikCheckbox, FormikDatePicker, FormikSelectField } from '@/components/formik-helpers';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Icon,
	IconButton,
	Typography,
} from '@/components/v2';
import { ChartHeaderContext } from '@/forecasts/charts/components/chart-header-selection/ChartHeaderContext';
import { confirmationAlert, genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { useVisibleDialog } from '@/helpers/dialog';
import { Hook } from '@/helpers/hooks';
import { downloadFile, postApi, putApi } from '@/helpers/routing';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';

// import {
// 	dataResolutionOptions,
// 	forecastSegmentEndingCondition,
// 	forecastUnits,
// 	toLifeOptions,
// 	wellIdKeyOptions,
// } from '@/scenarios/Scenario/ScenarioPage/exports/ExportToAriesDialog';
//
import { ChartExportsFormV2 } from '../exports/ChartExportsForm';
import { PreviousExportsList } from '../exports/PreviousExportsList';
import { DownloadForecastExportDialog } from './DownloadForecastExportDialog';

// TODO: move to shared file

const Container = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(calc(50% - 0.5rem), 1fr));
	gap: 1rem;
`;

function CsvExportForm({ formik, isProximity }) {
	/** @type {{ values: CsvFormValues }} */
	const { values, setFieldValue } = formik;

	useEffect(() => {
		if (isProximity && values.production.include && values.forecast.include) {
			setFieldValue('forecast.mergeWithProduction', true);
		} else if (values.forecast.mergeWithProduction && (!values.production.include || !values.forecast.include)) {
			setFieldValue('forecast.mergeWithProduction', false);
		}
	}, [
		values.forecast.mergeWithProduction,
		values.production.include,
		values.forecast.include,
		setFieldValue,
		isProximity,
	]);

	useEffect(() => {
		if (values.forecast.mergeWithProduction && values.forecast.resolution !== values.production.resolution) {
			setFieldValue('production.resolution', values.forecast.resolution);
		}
	}, [values.forecast.mergeWithProduction, values.forecast.resolution, values.production.resolution, setFieldValue]);

	return (
		<div>
			<h3>Forecast</h3>
			<FormikCheckbox name='forecast.include' label='Include Forecast' />
			{values.forecast.include && (
				<>
					{!isProximity && (
						<FormikSelectField
							name='forecast.resolution'
							label='Production Download'
							menuItems={[
								{ value: 'monthly', label: 'Monthly' },
								{ value: 'daily', label: 'Daily' },
							]}
							fullWidth
						/>
					)}

					<FormikDatePicker
						name='forecast.start'
						label='Forecast Start Date (empty for beginning of forecast)'
						fullWidth
					/>
					<FormikDatePicker
						name='forecast.end'
						label='Forecast End Date (empty for end of forecast)'
						fullWidth
					/>
				</>
			)}
			<h3>Production</h3>
			<FormikCheckbox name='production.include' label='Include Production' />
			{values.production.include && (
				<>
					{!isProximity && (
						<FormikSelectField
							name='production.resolution'
							label='Production Download'
							menuItems={[
								{ value: 'monthly', label: 'Monthly' },
								{ value: 'daily', label: 'Daily' },
							]}
							fullWidth
							disabled={values.forecast.mergeWithProduction}
						/>
					)}
					<FormikDatePicker
						name='production.start'
						label='Production Start Date (empty for beginning of production)'
						fullWidth
					/>
					<FormikDatePicker
						name='production.end'
						label='Production End Date (empty for end of production)'
						fullWidth
					/>
				</>
			)}
			<div style={{ 'margin-top': '2rem', 'margin-left': '-1rem' }}>
				{isProximity ? (
					<Field
						type='hidden'
						name='forecast.mergeWithProduction'
						value={values.production.include && values.forecast.include}
					/>
				) : (
					<FormikCheckbox
						name='forecast.mergeWithProduction'
						label='Merge Forecast and Production'
						disabled={!values.production.include || !values.forecast.include}
					/>
				)}
			</div>
		</div>
	);
}

/**
 * @typedef {{
 * 	forecast: {
 * 		include: boolean;
 * 		mergeWithProduction: boolean;
 * 		resolution: string;
 * 		start: string;
 * 		end: string;
 * 	};
 * 	production: {
 * 		include: boolean;
 * 		resolution: string;
 * 		start: string;
 * 		end: string;
 * 	};
 * }} CsvFormValues
 */

/**
 * @typedef {{
 * 	documentFormat: string;
 * 	includeParameters: boolean;
 * }} ChartsFormValues
 */

/**
 * @param {CsvFormValues} formValues
 * @returns {ForecastExport.Settings}
 */
function getExportPayloadFromFormValues(formValues) {
	// NOTE for now it only supports one resolution (daily or monthly) of forecast and one of production, but in the future it might support all of them
	const isEmpty = (value) => [null, undefined, ''].includes(value);
	const result = {};
	if (formValues.forecast.include) {
		const key = formValues.forecast.resolution === 'daily' ? 'forecastDaily' : 'forecastMonthly';
		result[key] = omitBy(
			pick(formValues.forecast, ['start', 'end', 'include', 'pSeries', 'mergeWithProduction']),
			isEmpty
		);
	}
	if (formValues.production.include) {
		const key = formValues.production.resolution === 'daily' ? 'productionDaily' : 'productionMonthly';
		result[key] = omitBy(pick(formValues.production, ['start', 'end', 'include', 'exportPressure']), isEmpty);
	}
	return result;
}

const dataExportKinds = ['forecastDaily', 'forecastMonthly', 'productionDaily', 'productionMonthly'];

export function ExportToCSVDialog({ forecast, wells = [], resolve: _resolve, visible, onHide }) {
	const forecastId = forecast?._id;

	const queryClient = useQueryClient();

	const reload = useCallback(
		() => queryClient.invalidateQueries(['forecast', forecastId, dataExportKinds]),
		[forecastId, queryClient]
	);

	const [dialog] = useVisibleDialog(DownloadForecastExportDialog, { forecast });

	const createExportMutation = useMutation(
		/**
		 * @param {ForecastExport.Create.RequestPayload} payload
		 * @returns {Promise<ForecastExport.Create.ResponsePayload>}
		 */
		(payload) => postApi(`/forecast/${forecastId}/export-forecast-data`, payload),
		{ onSuccess: reload }
	);

	const exportForecastDataNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.forecastId === forecastId) {
				reload();
			}
		},
		[forecastId, reload]
	);
	useUserNotificationCallback(NotificationType.EXPORT_FORECAST_DATA, exportForecastDataNotificationCallback);

	/** @param {CsvFormValues} formValues */
	const submit = async (formValues) => {
		try {
			await createExportMutation.mutateAsync({
				wells,
				settings: getExportPayloadFromFormValues(formValues),
			});
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const validate = ({ forecast: forecastSettings, production }) =>
		!forecastSettings?.include && !production?.include ? { general: 'Must include some data to export' } : {};

	return (
		<Formik
			onSubmit={submit}
			validate={validate}
			initialValues={{
				forecast: { include: true, mergeWithProduction: false, resolution: 'monthly', start: '', end: '' },
				production: { include: false, resolution: 'monthly', start: '', end: '' },
			}}
		>
			{(formik) => (
				<Dialog fullWidth maxWidth='md' open={visible}>
					<DialogTitle>Export Forecast & Prod Volumes</DialogTitle>

					<DialogContent>
						{dialog}
						<Hook hook={useLoadingBar} props={[formik.isSubmitting]} />
						<Container>
							<CsvExportForm formik={formik} />
						</Container>
					</DialogContent>

					<DialogActions>
						<Button onClick={onHide}>Cancel</Button>

						<Button
							color='secondary'
							disabled={formik.isSubmitting || formik.isValidating || !formik.isValid}
							// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
							onClick={formik.submitForm}
							variant='contained'
						>
							Export Charts
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</Formik>
	);
}

export function ExportProximityToCSVDialog({ forecast, visible, onHide, forecastsWellsMap }) {
	const forecastId = forecast?._id;
	const wellLength = Object.values(forecastsWellsMap ?? {}).reduce((prev, current) => (prev += current.length), 0);

	const [dialog] = useVisibleDialog(DownloadForecastExportDialog, { forecast });

	/** @param {CsvFormValues} formValues */
	const submitProximity = async (formValues) => {
		try {
			const {
				success,
				file_id: fileId,
				error_info: errorInfo,
			} = await putApi(`/forecast/${forecastId}/forecast-volumes-export`, {
				forecastId,
				forecastsWellsMap,
				forecastType: 'deterministic',
				settings: getExportPayloadFromFormValues(formValues),
			});
			if (!success) {
				throw Error(errorInfo);
			}
			await downloadFile(fileId);
		} catch (e) {
			genericErrorAlert(e);
		}
	};

	const validate = (values) => {
		const errors = {};
		if (!wellLength) {
			errors.general = 'Must include some data to export';
		}
		if (!values.forecast.include && !values.production.include) {
			errors.general = 'Must select one of them to export';
		}
		return errors;
	};

	return (
		<Formik
			onSubmit={submitProximity}
			validate={validate}
			initialValues={{
				forecast: { include: true, mergeWithProduction: false, resolution: 'monthly', start: '', end: '' },
				production: { include: false, resolution: 'monthly', start: '', end: '' },
			}}
		>
			{(formik) => (
				<Dialog fullWidth maxWidth='sm' open={visible}>
					<DialogTitle>Export Forecast & Prod Volumes</DialogTitle>

					<DialogContent>
						{dialog}
						<Hook hook={useLoadingBar} props={[formik.isSubmitting]} />
						<CsvExportForm formik={formik} isProximity />
					</DialogContent>

					<DialogActions>
						<Button onClick={onHide}>Close</Button>

						<Button
							color='secondary'
							disabled={formik.isSubmitting || formik.isValidating || !formik.isValid}
							// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
							onClick={formik.submitForm}
							variant='contained'
						>{`Export (${wellLength})`}</Button>
					</DialogActions>
				</Dialog>
			)}
		</Formik>
	);
}

const chartExportKinds = ['charts'];

const defaultValues = {
	includeParameters: true,
	includeComments: true,
	includeCompare: false,
	aries: {
		include: false,
		selectedIdKey: 'inptID',
		endingConditions: 'years',
		forecastUnit: 'per_day',
		toLife: 'no',
		dataResolution: 'same_as_forecast',
		includeOriginalForecast: false,
	},
	documentFormat: 'pdf',
	orientation: 'landscape',
};

export function ExportChartsDialog({ forecast, wells = [], chartsConfig, resolve: _resolve, visible, onHide }) {
	const forecastId = forecast?._id;

	const { headers, projectHeaders } = useContext(ChartHeaderContext);

	const queryClient = useQueryClient();

	const reload = useCallback(
		() => queryClient.invalidateQueries(['forecast', forecastId, chartExportKinds]),
		[forecastId, queryClient]
	);

	const createExportMutation = useMutation(
		/**
		 * @param {ForecastExport.Create.RequestPayload} payload
		 * @returns {Promise<ForecastExport.Create.ResponsePayload>}
		 */
		(payload) => postApi(`/forecast/${forecastId}/export-forecast-charts`, payload),
		{ onSuccess: reload }
	);

	const exportForecastChartsNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.forecastId === forecastId) {
				reload();
			}
		},
		[forecastId, reload]
	);
	useUserNotificationCallback(NotificationType.EXPORT_FORECAST_CHARTS, exportForecastChartsNotificationCallback);

	/** @param {ChartsFormValues} formValues */
	const submit = async (formValues) => {
		try {
			await createExportMutation.mutateAsync({
				wells,
				settings: { ...chartsConfig, ...formValues, headers, projectHeaders },
			});
			confirmationAlert('Charts export task is created successfully');
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const methods = useForm({ defaultValues });

	const {
		handleSubmit,
		formState: { isSubmitting, isValidating, isValid },
	} = methods;

	return (
		<FormProvider {...methods}>
			<Dialog fullWdith maxWidth='sm' open={visible}>
				<DialogTitle
					css={`
						width: 100%;
						display: flex;
						justify-content: space-between;
					`}
					disableTypography
				>
					<Typography variant='h6'>Export Charts</Typography>
					<IconButton disabled={isSubmitting} size='small' onClick={onHide}>
						{faTimes}
					</IconButton>
				</DialogTitle>

				<DialogContent
					css={`
						display: flex;
						flex-direction: column;
						min-width: 37.5rem;
						min-height: 36rem;
					`}
				>
					<Hook hook={useLoadingBar} props={[isSubmitting]} />
					<Accordion defaultExpanded>
						<AccordionSummary expandIcon={<Icon>{faChevronDown}</Icon>}>
							<Typography variant='h6'>Parameters</Typography>
						</AccordionSummary>

						<AccordionDetails>
							<ChartExportsFormV2 />
						</AccordionDetails>
					</Accordion>
					<Accordion>
						<AccordionSummary expandIcon={<Icon>{faChevronDown}</Icon>}>
							<Typography variant='h6'>Previous Exports</Typography>
						</AccordionSummary>

						<AccordionDetails>
							<PreviousExportsList forecastId={forecastId} forecast={forecast} />
						</AccordionDetails>
					</Accordion>
				</DialogContent>

				<DialogActions>
					<Box
						display='flex'
						width='100%'
						justifyContent='flex-end'
						css={`
							margin: 1.5rem;
							gap: 1rem;
						`}
					>
						<Button onClick={onHide}>Cancel</Button>

						<Button
							color='secondary'
							disabled={isSubmitting || isValidating || !isValid}
							// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
							onClick={handleSubmit(submit)}
							variant='contained'
						>
							Export
						</Button>
					</Box>
				</DialogActions>
			</Dialog>
		</FormProvider>
	);
}
