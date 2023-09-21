import { faInfoCircle } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';

import { useMergedState } from '@/components/hooks';
import {
	Box,
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Icon,
	ReactDatePicker,
	SwitchField,
} from '@/components/v2';
import { InfoTooltipWrapper } from '@/components/v2/misc';
import { DAYS_IN_YEAR } from '@/forecasts/charts/forecastChartHelper';
import {
	GreyFont,
	dailyRollupWarning,
	resolutionTooltip,
	rollupDailyTooltip,
	rollupTitle,
	useStyles,
	validateDates,
} from '@/forecasts/forecast-rollup/ForecastRollup';
import { genericErrorAlert, withDoggo } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { daysToMS, msToDays } from '@/helpers/math';
import { postApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { SectionContent } from '@/layouts/Section';

import {
	BY_WELL_TEMPLATE,
	COLLECTION_TEMPLATE,
	COLUMN_TEMPLATE,
	RESOLUTION_TEMPLATE,
	ROLL_UP_BATCH_YEAR_LIMIT,
} from './RollUpTemplate';
import useRollupHeaders from './useRollupHeaders';

const RollupDatePicker = (props) => {
	return <ReactDatePicker fullWidth variant='outlined' {...props} />;
};

export default function RollUpDialog({
	onHide,
	resolve,
	visible,
	scenarioId,
	scenarioWellAssignments,
}: DialogProps<Inpt.Task> & { scenarioId: string; scenarioWellAssignments: string[] }) {
	const { addHeader, renderRollupHeaders, headersArr, sortedPhases } = useRollupHeaders();
	const classes = useStyles();
	const [columns, setColumns] = useState(new Set());
	const [dates, setDates] = useState<{ start: Date | null; end: Date | null; ignoreForecast?: Date | null }>({
		start: null,
		end: null,
		ignoreForecast: null,
	});
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

	const [loaded, setLoaded] = useState(false);
	const useRollUpApi = !resolutionCollections.daily && scenarioWellAssignments.length <= 10;

	const buildRollUp = async () => {
		const body = {
			columns: [...columns],
			dates,
			scenarioWellAssignments,
			wellHeaders: headersArr,
			selectedCollections,
			resolutionCollections,
			byWellCollections,
			phasePreference: sortedPhases,
		};

		try {
			const endpoint = useRollUpApi
				? `/scenarios/${scenarioId}/handleApiScenarioRollup`
				: `/scenarios/${scenarioId}/buildRollUpChart`;
			const { task } = await withDoggo(postApi(endpoint, body));
			resolve(task);
		} catch (err) {
			genericErrorAlert(err, 'Failed start build roll up chart');
		}
	};

	const { refetch: runBuildRollup, isFetching: buildRollupIsRunning } = useQuery(
		['roll-up', 'scenario', scenarioId],
		buildRollUp,
		{ enabled: false }
	);

	// componentMount + Update
	useEffect(() => {
		if (visible) {
			const date = new Date();
			setColumns(new Set(Object.keys(COLUMN_TEMPLATE)));
			setDates({
				start: new Date(date.getFullYear() - 1, 0, 1),
				end: new Date(date.getFullYear() + 5, 11, 31),
			});

			setLoaded(true);
		} else {
			setLoaded(false);
		}
	}, [visible]);

	const yearLimit = useMemo(() => (resolutionCollections.daily ? 20 : 50), [resolutionCollections.daily]);
	const setMaxDate = useCallback(
		(newDates) => {
			if (Math.floor(msToDays(newDates.end.getTime() - newDates.start.getTime()) / DAYS_IN_YEAR) > yearLimit) {
				newDates.end = new Date(
					Number(new Date(newDates.start)) + Math.ceil(daysToMS(DAYS_IN_YEAR * yearLimit))
				);
			}
		},
		[yearLimit]
	);
	const setDate = (key, val) => {
		setDates((p) =>
			produce(p, (newDates) => {
				const date = new Date(val);
				if (key === 'ignoreForecast') {
					if (val === null) {
						delete newDates.ignoreForecast;
					} else {
						newDates.ignoreForecast = date;
					}
				} else {
					newDates[key] =
						key === 'start'
							? new Date(date.getFullYear(), date.getMonth(), 1)
							: new Date(date.getFullYear(), date.getMonth() + 1, 0);
				}
				if (newDates.start && newDates.end) {
					if (newDates.start > newDates.end) {
						const startDate = new Date(newDates.start);
						newDates.end = new Date(startDate.getFullYear(), date.getMonth() + 1, 0);
					}
					setMaxDate(newDates);
				}
			})
		);
	};

	useEffect(() => {
		setDates(
			produce((currentDates) => {
				if (currentDates.start && currentDates.end) {
					setMaxDate(currentDates);
				}
			})
		);
	}, [setMaxDate, yearLimit]);

	const hasSelectedCollections =
		selectedCollections.stitch || selectedCollections.onlyProduction || selectedCollections.onlyForecast;

	const hasResolutionCollections = resolutionCollections.daily || resolutionCollections.monthly;
	const dailyBatchSize = 10;
	const validateRollup = validateDates(
		dates,
		scenarioWellAssignments,
		byWellCollections,
		resolutionCollections,
		dailyBatchSize
	);

	return (
		<Dialog open={visible} classes={{ paper: classes.dialogPaper }} overflow-x='hidden'>
			<DialogTitle>{rollupTitle(scenarioWellAssignments)}</DialogTitle>
			{loaded && (
				<DialogContent>
					<SectionContent css='overflow-x:hidden'>
						<Divider css='margin-bottom:0.5rem' />
						<div>
							<div css='margin-bottom:0.25rem'>Date Range</div>

							<GreyFont css='margin-bottom:0.5rem'>
								Specify a date range for aggregating stream types
							</GreyFont>
						</div>
						<div
							css={`
								display: flex;
								width: 100%;
								justify-content: space-between;
							`}
						>
							<div css='width: calc(50% - 1rem);'>
								<RollupDatePicker
									label='Start Date'
									onChange={(value) => {
										setDate('start', value);
									}}
									selected={dates.start}
									showMonthYearPicker
								/>
							</div>
							<div css='width: calc(50% - 1rem);'>
								<RollupDatePicker
									label='End Date'
									onChange={(value) => setDate('end', value)}
									selected={dates.end}
									showMonthYearPicker
								/>
							</div>
						</div>
						<Box
							css={`
								width: calc(50% - 1rem);
								padding-top: 0.5rem;
							`}
						>
							<RollupDatePicker
								label='Ignore Forecast Prior To Date'
								onChange={(value) => setDate('ignoreForecast', value)}
								selected={dates.ignoreForecast}
							/>
						</Box>
						<Divider css='margin-top:1rem' />
						<Box paddingY='1rem'>
							<div css='padding-left:3px; font-size:1rem'>Stream Type</div>
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
						<Box paddingY='1rem' display='flex'>
							<div css='width:35%; '>
								<InfoTooltipWrapper tooltipTitle={resolutionTooltip}>
									<div css='padding-left:3px; font-size:1rem'>Resolution</div>
								</InfoTooltipWrapper>
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
									<Icon css='margin-right: 1rem; margin-left:1rem;' fontSize='small' color='default'>
										{faInfoCircle}
									</Icon>
									{rollupDailyTooltip(
										dailyBatchSize,
										dailyBatchSize * ROLL_UP_BATCH_YEAR_LIMIT,
										true
									)}
								</div>
							)}
						</Box>
						<Divider />
						{['byWell'].map((value) => (
							<div key={value}>
								<Box
									display='flex'
									alignItems='center'
									paddingLeft='10px'
									justifyContent='space-between'
									marginTop='0'
									paddingTop='1rem'
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
										label=''
										onClick={() => setByWellCollections({ [value]: !byWellCollections[value] })}
										labelPlacement='start'
									/>
								</Box>
								<GreyFont css='padding-left:10px; margin-top:0'>
									Permanently save well level production to BigQuery to download daily or monthly
									production volumes
								</GreyFont>
							</div>
						))}
						<Divider css='margin: 1rem 0 1rem' />

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
			)}
			{dailyRollupWarning(validateRollup)}
			<DialogActions>
				<Button onClick={() => onHide()}>Close</Button>
				<Button
					onClick={() => runBuildRollup()}
					color='primary'
					disabled={
						!scenarioWellAssignments.length ||
						!columns.size ||
						!hasSelectedCollections ||
						!hasResolutionCollections ||
						buildRollupIsRunning ||
						!validateRollup
					}
				>
					Run ({scenarioWellAssignments?.length ?? 0})
				</Button>
			</DialogActions>
		</Dialog>
	);
}
