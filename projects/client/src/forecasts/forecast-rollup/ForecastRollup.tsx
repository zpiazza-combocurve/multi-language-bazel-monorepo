import { faExclamationTriangle, faInfoCircle } from '@fortawesome/pro-regular-svg-icons';
import { makeStyles } from '@material-ui/core/styles';
import { FormikProvider, useFormik } from 'formik';
import _, { noop } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import usePermissions from '@/access-policies/usePermissions';
import { FormikDatePicker } from '@/components/formik-helpers';
import { useMergedState } from '@/components/hooks';
import {
	Box,
	Button,
	ButtonItem,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Icon,
	MenuButton,
	SwitchField,
} from '@/components/v2';
import { RadioGroupField, SelectField } from '@/components/v2/formik-fields';
import { InfoTooltipWrapper } from '@/components/v2/misc';
import { DAYS_IN_YEAR } from '@/forecasts/charts/forecastChartHelper';
import { genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { getApi, postApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { assert } from '@/helpers/utilities';
import { forecastSeries } from '@/helpers/zing';
import { SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { MAX_FORECAST_NAME_VISIBLE_CHARACTERS } from '@/inpt-shared/constants';
import { SectionContent, SectionFooter } from '@/layouts/Section';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import RollUpChartDialog from '@/scenarios/roll-up-chart/RollUpChartDialog';
import {
	BY_WELL_TEMPLATE,
	COLLECTION_TEMPLATE,
	ONE_DAY,
	RESOLUTION_TEMPLATE,
	ROLL_UP_BATCH_YEAR_LIMIT,
} from '@/scenarios/roll-up-chart/RollUpTemplate';
import useRollupHeaders from '@/scenarios/roll-up-chart/useRollupHeaders';

import { useAllProjectForecasts } from '../charts/components/deterministic/grid-chart/api';
import { ProjectForecastItem } from '../types';

export const GreyFont = styled.p`
	font-size: 0.75rem;
	color: ${(props) => props.theme.palette.text.secondary} !important;
	margin-bottom: 0;
`;

export const validateDates = (dates, wells, byWellCollections, resolutionCollections, dailyBatchSize) => {
	if (!(byWellCollections.byWell || resolutionCollections.daily)) {
		return true;
	}
	if (wells?.length >= dailyBatchSize) {
		return (dates.end - dates.start) / ONE_DAY <= ROLL_UP_BATCH_YEAR_LIMIT * DAYS_IN_YEAR + 1;
	} else {
		return (
			wells?.length * ((dates.end - dates.start) / ONE_DAY / DAYS_IN_YEAR) <=
			dailyBatchSize * ROLL_UP_BATCH_YEAR_LIMIT + 1
		);
	}
};

export const resolutionTooltip =
	'Roll-up will display data resolution used to generate the forecast. ' +
	'i.e. Monthly resolution forecasts will display monthly production history.';

export const useStyles = makeStyles({
	dialogPaper: {
		minHeight: '90vh',
		maxHeight: '90vh',
		minWidth: '40vw',
		maxWidth: '40vw',
	},
});

export const dailyRollupWarning = (validateRollup) => (
	<SectionFooter css='flex:0 0 auto'>
		{!validateRollup && (
			<>
				<Divider />
				<div css='display:flex; align-items:center; padding-left: 10px; padding-top:0.5rem'>
					<Icon css='margin-right: 0.25rem;' color='warning'>
						{faExclamationTriangle}
					</Icon>
					<GreyFont css='padding-left:10px'>
						The current date range and well count has exceeded the limits. Please change the date range
						according to the limits description.
					</GreyFont>
				</div>
			</>
		)}
	</SectionFooter>
);

export const rollupTitle = (wells) => (
	<div css='display:flex ; flex-direction:row; align-items:flex-end;'>
		<h3
			css={`
				margin-right: 1rem;
				margin-bottom: 0;
			`}
		>
			Generate Roll-Up
		</h3>
		<GreyFont>Total Well Count ({wells?.length ?? 0}) </GreyFont>
	</div>
);

export const rollupDailyTooltip = (batchLimit, totalLimit, scenario) => (
	<div>
		<b>Daily</b>
		{scenario && <> : 20 Years Max</>}
		{!scenario && (
			<>
				<br /> Limitations based on well count threshold :
				<br /> For well counts {'<='} <b>{batchLimit}</b>, Well Count * Years {'<='} <b>{totalLimit}</b>
				<br /> For well counts {'>'} <b>{batchLimit}</b>, the date range must be
				{' <'}
				<b> 20 </b> Years
			</>
		)}
	</div>
);

const ForecastRollup = ({
	disableForecastTasks,
	forecastId,
	forecastType = 'probabilistic',
	isTaskRunning,
	onHide = noop,
	setTask,
	wells = [],
	...rest
}: {
	disableForecastTasks?: boolean;
	forecastId: string;
	forecastType: 'probabilistic' | 'deterministic';
	isTaskRunning?: boolean;
	onHide?: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setTask: (v: any) => void;
	wells: Array<string>;
}) => {
	const classes = useStyles();
	const { project } = useAlfa();
	assert(project?._id);

	const allProjectForecastsQuery = useAllProjectForecasts(project._id);
	const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, project._id);

	const [chartData, setChartData] = useState(null);
	const [comparedForecast, setComparedForecast] = useState<Array<string>>([]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [forecasts, setForecasts] = useState<Array<Record<string, any>>>([]);
	const [isComparisonRunning, setIsComparisonRunning] = useState(true); // is it finished?
	const [isRollUpChartVisible, setIsRollUpChartVisible] = useState(false);
	const [isRollupDialogVisible, setIsRollupDialogVisible] = useState(false);
	const [runId, setRunId] = useState(null);
	const [titleItems, setTitleItems] = useState<Array<string>>([]);

	const [selectedCollections, setSelectedCollections] = useMergedState({
		stitch: true,
		onlyProduction: false,
		onlyForecast: false,
	});

	const [resolutionCollections, setResolutionCollections] = useMergedState({
		monthly: true,
		daily: false,
	});

	const [byWellCollections, setByWellCollections] = useMergedState({
		byWell: false,
	});

	const [overlapCollections, setOverlapCollections] = useMergedState({
		overlap: false,
	});
	const { addHeader, renderRollupHeaders, headersArr, sortedPhases } = useRollupHeaders();

	const nowDate = new Date();

	const getComparedForecastwells = useCallback(
		(comparedForecastId) =>
			overlapCollections.overlap
				? forecasts
						.filter((f) => f._id === comparedForecastId)?.[0]
						?.['wells']?.filter((item) => wells.includes(item)) ?? []
				: forecasts.filter((f) => f._id === comparedForecastId)?.[0]?.['wells'] ?? [],
		[forecasts, overlapCollections.overlap, wells]
	);

	const onClose = () => {
		onHide();
		setIsRollupDialogVisible(false);
	};

	const formik = useFormik({
		initialValues: {
			dates: {
				start: new Date(nowDate.getFullYear() - 1, 0, 1),
				end: new Date(nowDate.getFullYear() + 5, 11, 31),
				ignoreForecast: null,
			},
			pSeries: 'best',
			comparedForecastId: null,
		},
		onSubmit: async ({ dates, pSeries, comparedForecastId }) => {
			const comparedForecastwells = getComparedForecastwells(comparedForecastId);
			const currentForecastWells = overlapCollections.overlap ? comparedForecastwells : wells;
			const body = {
				dates,
				headers: headersArr,
				pSeries,
				wells: currentForecastWells,
				selectedCollections,
				resolutionCollections,
				byWellCollections,
				phasePreference: sortedPhases,
				comparedForecast: comparedForecastId,
			};

			try {
				const { task } = await postApi(`/forecast/${forecastId}/buildRollUpChart`, body);

				if (comparedForecastId) {
					await postApi(`/forecast/${comparedForecastId}/buildRollUpChart`, {
						...body,
						wells: comparedForecastwells,
						comparedForecast: null,
					});
					setIsComparisonRunning(true);
				}

				setTask(task);
				onClose();
			} catch (err) {
				genericErrorAlert(err, 'Failed start build roll up chart');
			}
		},
	});

	const {
		isSubmitting,
		submitForm,
		values: { dates, comparedForecastId },
	} = formik;

	const forecastItems = forecasts.map((forecast) => {
		const { _id, name } = forecast;
		return { label: _.truncate(name, { length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS }), value: _id };
	});

	const { mutateAsync: getChartData, isLoading: isLoadingChartData } = useMutation(async () => {
		try {
			const { forecastName, projectName, rollUp } =
				(await withLoadingBar(getApi(`/forecast/getRollUpData/${forecastId}`))) ?? {};

			const { data, runDate, _id, comparedForecast } = rollUp ?? {};
			if (data) {
				setChartData({ ...data, forecastName });
				setTitleItems([
					`Project: ${projectName}`,
					`Forecast: ${forecastName}`,
					`Last Run: ${new Date(runDate).toLocaleString()}`,
				]);
				setRunId(_id);

				if (comparedForecast) {
					const { rollUp: comparedRollUp } =
						(await withLoadingBar(getApi(`/forecast/getRollUpData/${comparedForecast}`))) ?? {};
					const { running } = comparedRollUp ?? {};
					if (running) {
						setIsComparisonRunning(true);
					} else {
						setIsComparisonRunning(false);
					}
					if (comparedRollUp) {
						setComparedForecast([comparedForecast]);
					}
				} else {
					setIsComparisonRunning(false);
					setComparedForecast([]);
				}
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	const comparedForecastwells: Array<string> = useMemo(
		() => getComparedForecastwells(comparedForecastId),
		[getComparedForecastwells, comparedForecastId]
	);

	const comparedForecastIdValid = useMemo(
		() => (comparedForecastwells.length ? comparedForecastId : null),
		[comparedForecastwells, comparedForecastId]
	);

	const currentForecastWells = useMemo(
		() => (overlapCollections.overlap ? comparedForecastwells : wells),
		[comparedForecastwells, overlapCollections.overlap, wells]
	);

	const rollupNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.forecastId === forecastId) {
				setTask(null);
			}
			const comparedId = comparedForecast?.[0] ?? null;
			if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.forecastId === comparedId) {
				setIsComparisonRunning(false);
			}
		},
		[comparedForecast, forecastId, setTask]
	);
	useUserNotificationCallback(NotificationType.ROLL_UP, rollupNotificationCallback);

	const hasSelectedCollections =
		selectedCollections.stitch || selectedCollections.onlyProduction || selectedCollections.onlyForecast;

	const hasResolutionCollections = resolutionCollections.daily || resolutionCollections.monthly;
	const dailyBatchSize = 50;
	const validateRollup = validateDates(
		dates,
		currentForecastWells,
		byWellCollections,
		resolutionCollections,
		dailyBatchSize
	);
	const validateComparedRollup = comparedForecastIdValid
		? validateDates(dates, comparedForecastwells, byWellCollections, resolutionCollections, dailyBatchSize) &&
		  comparedForecastwells?.length
		: true;
	const dateCheck = (value) => {
		const maxYear = 100;
		if (value < dates.start) {
			return 'Cannot be less than start date';
		}

		if ((value - Number(dates.start)) / ONE_DAY > maxYear * DAYS_IN_YEAR) {
			return 'Cannot be longer than 100 Years';
		}
	};

	useEffect(() => {
		// isTaskRunning is based on the active taskId in the parent component. it is always set to null on task completion. chart data is re-grabbed in this case
		if (!isTaskRunning) {
			getChartData();
		}
	}, [getChartData, isTaskRunning]);

	useEffect(() => {
		const init = async () => {
			const initForecasts = allProjectForecastsQuery.data as ProjectForecastItem[];
			const initComparedForecasts = initForecasts.filter((forecast) => forecast._id !== forecastId);
			setForecasts(initComparedForecasts);
		};

		if (allProjectForecastsQuery.isSuccess) {
			init();
		}
	}, [allProjectForecastsQuery.data, allProjectForecastsQuery.isSuccess, project._id, forecastId]);

	return (
		<FormikProvider value={formik}>
			<MenuButton label='Roll-Up' {...rest}>
				<ButtonItem
					label='Generate Roll-Up'
					disabled={!canUpdateForecast || disableForecastTasks}
					onClick={() => setIsRollupDialogVisible(true)}
				/>

				<ButtonItem
					label='View Roll-Up Chart'
					onClick={() => setIsRollUpChartVisible(true)}
					disabled={!chartData || isLoadingChartData || isComparisonRunning || disableForecastTasks}
				/>
			</MenuButton>

			<Dialog
				id='forecast-rollup-dialog'
				aria-labelledby='forecast-rollup-dialog'
				classes={{ paper: classes.dialogPaper }}
				// onHide={onClose}
				open={isRollupDialogVisible}
				overflow-x='hidden'
			>
				<DialogTitle>{rollupTitle(currentForecastWells)}</DialogTitle>
				<DialogContent>
					<SectionContent
						css={`
							display: flex;
							flex-direction: column;
							overflow-x: hidden;
							row-gap: 0.5rem;
						`}
					>
						<Divider />

						<section>
							<div>
								<div css='margin-bottom:0.25rem'>Date Range</div>
								<GreyFont>Specify a date range for aggregating stream types</GreyFont>
							</div>
							<div
								css={`
									display: flex;
									width: 100%;
									justify-content: space-between;
								`}
							>
								<div css='width: 45%'>
									<FormikDatePicker label='Start Date' name='dates.start' fullWidth />
								</div>
								<div css='width: 45%'>
									<FormikDatePicker
										label='End Date'
										name='dates.end'
										validate={dateCheck}
										fullWidth
									/>
								</div>
							</div>

							<Box
								css={`
									display: flex;
									flex-direction: column;
									row-gap: 1rem;
								`}
								width='45%'
							>
								<FormikDatePicker
									label='Ignore Forecast Prior To Date'
									name='dates.ignoreForecast'
									fullWidth
								/>

								{forecastType === 'probabilistic' && (
									<RadioGroupField
										label='PSeries Selection:'
										name='pSeries'
										options={forecastSeries}
										row
									/>
								)}
							</Box>
						</section>

						<Divider />

						<section>
							<div
								css={`
									align-items: center;
									display: flex;
								`}
							>
								<GreyFont css='flex-basis: 45%; flex:1; padding-left:10px;'>
									Select a forecast to generate a roll-up comparison
								</GreyFont>

								<SelectField
									css='flex-basis: 45%;'
									disabled={!forecasts?.length}
									label={<span css='padding-left:10px'>Forecast Comparison</span>}
									menuItems={forecastItems}
									name='comparedForecastId'
									placeholder='Select A Forecast'
								/>
							</div>

							{['overlap'].map((value) => (
								<CheckboxField
									key={value}
									checked={overlapCollections[value]}
									disabled={!forecasts?.length}
									label='Overlapping wells only'
									onClick={() => setOverlapCollections({ [value]: !overlapCollections[value] })}
								/>
							))}
						</section>

						<Divider />

						<Box>
							<div css='padding-left:10px'>Stream Type</div>
							{['stitch', 'onlyForecast', 'onlyProduction'].map((value) => (
								<CheckboxField
									key={value}
									label={COLLECTION_TEMPLATE[value].label}
									checked={selectedCollections[value]}
									onClick={() => setSelectedCollections({ [value]: !selectedCollections[value] })}
								/>
							))}
						</Box>

						<Divider />

						<Box display='flex'>
							<div css='width:35%;'>
								<div css='padding-left:10px'>
									<InfoTooltipWrapper tooltipTitle={resolutionTooltip}>
										<div>Resolution</div>
									</InfoTooltipWrapper>
								</div>
								{['monthly', 'daily'].map((value) => (
									<CheckboxField
										key={value}
										label={RESOLUTION_TEMPLATE[value].label}
										checked={resolutionCollections[value]}
										onClick={() =>
											setResolutionCollections({ [value]: !resolutionCollections[value] })
										}
									/>
								))}
							</div>

							{resolutionCollections.daily && (
								<div
									css={`
										background-color: ${theme.backgroundOpaque};
										display: flex;
										align-items: center;
										width: 65%;
										padding: 0.5rem;
										min-width: 28rem;
									`}
								>
									<Icon css='margin-right: 1rem; margin-left:1rem;' fontSize='small'>
										{faInfoCircle}
									</Icon>

									{rollupDailyTooltip(
										dailyBatchSize,
										dailyBatchSize * ROLL_UP_BATCH_YEAR_LIMIT,
										false
									)}
								</div>
							)}
						</Box>

						<Divider />

						<section>
							{['byWell'].map((value) => (
								<>
									<Box
										alignItems='center'
										display='flex'
										justifyContent='space-between'
										paddingLeft='10px'
										paddingRight='1rem'
									>
										<div>
											{BY_WELL_TEMPLATE[value].label}{' '}
											<Box
												fontSize='.75rem'
												css={`
													padding: 2px 5px;
													border-radius: 0.5rem;
													background-color: orange;
													display: inline-block;
													margin-right: 0;
													margin-left: 0.25rem;
													font-weight: bold;
												`}
											>
												BETA Release
											</Box>
										</div>
										<SwitchField
											key={value}
											checked={byWellCollections[value]}
											onClick={() => setByWellCollections({ [value]: !byWellCollections[value] })}
											labelPlacement='start'
										/>
									</Box>
									<GreyFont css='padding-left:10px'>
										Permanently save well level production to BigQuery to download daily or monthly
										production volumes
									</GreyFont>
								</>
							))}
						</section>

						<Divider />

						<Box
							css={`
								display: inline-block;
								width: 50%;
							`}
						>
							<Button
								onClick={addHeader}
								disabled={headersArr?.length >= 2 && 'No more than 2 headers'}
								variant='outlined'
								color='secondary'
							>
								Add Header
							</Button>
						</Box>

						{renderRollupHeaders}
					</SectionContent>
				</DialogContent>
				{dailyRollupWarning(validateRollup)}
				<DialogActions>
					<Button onClick={() => onClose()}>Close</Button>
					<Button
						onClick={submitForm}
						color='primary'
						disabled={
							!currentForecastWells?.length ||
							!formik.isValid ||
							!hasSelectedCollections ||
							!hasResolutionCollections ||
							isSubmitting ||
							!validateRollup ||
							!validateComparedRollup
						}
					>
						Run ({currentForecastWells?.length ?? 0})
					</Button>
				</DialogActions>
			</Dialog>

			<RollUpChartDialog
				close={useCallback(() => setIsRollUpChartVisible(false), [])}
				comparisonIds={comparedForecast}
				data={chartData}
				rollUpType='forecast'
				runId={runId}
				titleItems={titleItems}
				visible={isRollUpChartVisible}
			/>
		</FormikProvider>
	);
};

export default ForecastRollup;
