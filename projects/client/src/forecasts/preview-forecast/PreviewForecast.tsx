import { LinearProgress, makeStyles } from '@material-ui/core';
import { get } from 'lodash-es';
import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { useDerivedState } from '@/components/hooks';
import { Box, Dialog, DialogContent, Typography } from '@/components/v2/';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { errorFromInfo } from '@/helpers/errors';
import { getApi, putApi } from '@/helpers/routing';

import { Phase } from '../forecast-form/automatic-form/types';
import { DEFAULT_FORECAST_MENU_VALUES } from '../shared';
import PreviewChart from './PreviewChart';
import PreviewChartOptions from './PreviewChartOptions';
import PreviewWellList from './PreviewWellList';

export const HEADERS_KEYS = [
	'inptID',
	'api14',
	'well_number',
	'current_operator_alias',
	'county',
	'perf_lateral_length',
	'total_proppant_per_perforated_interval',
	'total_fluid_per_perforated_interval',
	'first_prod_date_daily_calc',
	'first_prod_date_monthly_calc',
];

export function useResolution() {
	const [resolution, setResolution] = useState('monthly');
	const toggleResolution = useCallback(() => {
		setResolution((p) => (p === 'monthly' ? 'daily' : 'monthly'));
	}, []);
	return { resolution, toggleResolution };
}

export function useChartOptions() {
	const [chartOptions, setChartOptions] = useState({
		lineScatter: true,
		logScale: true,
		xLogScale: false,
		pKey: 'best',
		chartType: 'all',
		...DEFAULT_FORECAST_MENU_VALUES,
	});
	const setChartOptionByKey = useCallback((key: string, value: string) => {
		setChartOptions((p) => ({ ...p, [key]: value }));
	}, []);
	return { chartOptions, setChartOption: setChartOptionByKey };
}

const useStyles = makeStyles(() => ({
	root: {
		'column-gap': '0.5rem',
		display: 'flex',
		'flex-direction': 'row',
		height: '100%',
		padding: '0.5rem',
	},
}));

export function useForecastPreviewQuery(
	{
		forecastId = null,
		scenarioId = null,
		scheduleId = null,
		resolution,
		source,
		well,
		wellAssignmentId = null,
	}: {
		/** Needed for source='forecast' */
		forecastId?: string | null;
		/** Needed for source='scenario' */
		scenarioId?: string | null;
		/** Needed for source='schedule' */
		scheduleId?: string | null;
		/** Either monthly or daily */
		resolution: string;
		/** Either 'scenario' or 'forecast' */
		source: string;
		/** Well id */
		well?: string;
		/** Well assignment used for 'scenario' source */
		wellAssignmentId?: string | null;
	},
	options
) {
	const query = {
		wellAssignmentId,
		fId: forecastId,
		sId: scenarioId,
		scheduleId,
		headers: HEADERS_KEYS,
		resolution,
		source,
	};

	return useQuery(
		['forecast-preview', well, query],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		() => getApi<any>(`/forecast/${forecastId}/getForecastPreview/${well}`, query), // TODO api types
		{
			enabled: !!well,
			...options,
		}
	);
}

export function getAvailablePKey(forecastPreview, { pKey, phase }) {
	const P_dict = forecastPreview?.data?.[phase]?.P_dict;
	const availablePKeys = Object.keys(P_dict);
	const newPKey = (availablePKeys.includes(pKey) ? pKey : availablePKeys[0]) ?? 'best';
	return newPKey;
}

export async function adjustWellEdit({ forecastPreview: forecast, wellId: curWell, checked, queryClient }) {
	try {
		if (!forecast.forecast?._id) {
			throw errorFromInfo({
				name: 'No Forecast',
				message: 'This well is not associated with any forecast',
				expected: true,
			});
		}

		const manualPath = checked ? 'add-to-manual' : 'remove-from-manual';
		await putApi(`/forecast/${forecast.forecast._id}/${manualPath}`, { wellIds: [curWell] });

		if (forecast.inEdit !== checked) {
			confirmationAlert(checked ? 'Added Well To Editing' : 'Removed Well From Editing');
		}

		queryClient.invalidateQueries(['forecast-preview']);
	} catch (err) {
		genericErrorAlert(err);
	}
}

export interface Props {
	close(reload?: boolean): void;
	visible: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	initWell: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	wells: any[];
	fId?: string;
	sId?: string;
	scheduleId?: string;
	source: 'scenario' | 'schedule';
	wellKey?: string;
	comparisonKey?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	comparisonProps?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setComparisonProps?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	sorting?: any[];
}

export default function PreviewForecast({
	wells,
	source,
	initWell,
	fId: forecastId,
	sId: scenarioId,
	scheduleId,
	wellKey,
	visible,
	close,
	// comparison does not apply to scenario
	comparisonKey,
	comparisonProps,
	setComparisonProps,
	sorting,
}: Props) {
	const getWell = (wellOrAssignment) => (wellKey ? get(wellOrAssignment, wellKey) : wellOrAssignment);
	const [phase, setPhase] = useState<Phase>('oil');
	const { resolution, toggleResolution } = useResolution();
	const { chartOptions, setChartOption } = useChartOptions();
	const [currentWell, setCurrentWell] = useDerivedState(initWell);
	const queryClient = useQueryClient();
	const [reloadOnExit, setReloadOnExit] = useState(false);

	const wellAssignmentId = ['scenario', 'schedule'].includes(source) ? currentWell?._id : null; // HACK assume if source === 'scenario' well is actuall an assignment well id

	const cancel = () => {
		close(reloadOnExit);
	};

	const { data, isLoading } = useForecastPreviewQuery(
		{
			well: getWell(currentWell),
			scenarioId,
			forecastId,
			scheduleId,
			resolution,
			source,
			wellAssignmentId,
		},
		{
			onSuccess: (f) => {
				setChartOption('pKey', getAvailablePKey(f, { pKey: chartOptions.pKey, phase }));
			},
			keepPreviousData: true,
		}
	);

	const adjustEdit = (checked = false) =>
		adjustWellEdit({
			forecastPreview: data,
			wellId: getWell(currentWell),
			checked,
			queryClient,
		});

	const forceExitReload = () => {
		setReloadOnExit(true);
	};

	const classes = useStyles();

	return (
		<Dialog open={visible} maxWidth='xl' fullWidth>
			{isLoading && (
				<Box sx={{ width: '100%', height: '95vh' }}>
					<LinearProgress />
				</Box>
			)}
			<DialogContent className={classes.root} css='min-height: 95vh'>
				{data && (
					<PreviewWellList
						css='flex: 1;'
						adjustEdit={adjustEdit}
						cancel={cancel}
						currentWell={currentWell}
						forecastPreview={data}
						onChangeCurrentWell={setCurrentWell}
						sorting={sorting}
						wellKey={wellKey}
						wells={wells}
					/>
				)}
				{data?.forecast ? (
					<>
						<PreviewChart
							css='flex: 3;'
							adjustEdit={adjustEdit}
							chartOptions={chartOptions}
							comparisonKey={comparisonKey}
							comparisonProps={comparisonProps}
							forceExitReload={forceExitReload}
							forecastPreview={data}
							phase={phase}
							resolution={resolution}
							setChartOption={setChartOption}
							setComparisonProps={setComparisonProps}
							toggleResolution={toggleResolution}
						/>
						<PreviewChartOptions
							css='flex: 1;'
							chartOptions={chartOptions}
							forecastPreview={data}
							onChangePhase={setPhase}
							phase={phase}
							setChartOption={setChartOption}
						/>
					</>
				) : (
					!isLoading && (
						<Box
							css={`
								display: flex;
								width: 100%;
								align-items: center;
								justify-content: center;
							`}
						>
							<Typography>No Forecast To Display</Typography>
						</Box>
					)
				)}
			</DialogContent>
		</Dialog>
	);
}
