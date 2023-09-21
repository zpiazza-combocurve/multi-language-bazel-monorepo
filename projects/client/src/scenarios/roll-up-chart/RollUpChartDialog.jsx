import { capitalize } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';

import { SelectField as ReactSelectField } from '@/components';
import { useMergedState } from '@/components/hooks';
import { Box, Button, CheckboxField, Divider, InfoIcon, InfoTooltipWrapper, SwitchField } from '@/components/v2';
import FullScreenDialog from '@/components/v2/misc/FullScreenDialog';
import ForecastChartContainer from '@/forecasts/charts/components/ForecastChartContainer';
import { failureAlert, genericErrorAlert, infoAlert } from '@/helpers/alerts';
import { downloadFile, getApi, postApi } from '@/helpers/routing';
import RollUpChart from '@/scenarios/roll-up-chart/RollUpChart';

import { COLLECTION_TEMPLATE, COLUMN_TEMPLATE } from './RollUpTemplate';

const RollUpChartContainer = styled.section`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
`;

const ChartControls = styled.section`
	align-items: center;
	display: flex;
	justify-content: space-between;
	padding: 0.5rem 1rem;
`;

const SelectFieldContainer = styled.div`
	align-items: baseline;
	display: flex;
`;

const SelectField = styled(ReactSelectField)`
	flex-grow: 1;
	margin: 0 0 0 0.5rem;
`;

const LabeledSelectField = (props) => {
	const { label, ...rest } = props;
	return (
		<SelectFieldContainer>
			<span>{`${label}:`}</span>
			<SelectField {...rest} fullWidth />
		</SelectFieldContainer>
	);
};

const genTitle = (items) => items.join(' | ');

const categoryKeys = Object.entries(COLUMN_TEMPLATE).reduce((obj, entry) => {
	const [key, value] = entry;
	const { category } = value;
	if (!obj[category]) {
		obj[category] = [];
	}

	obj[category].push(key);
	return obj;
}, {});

const getInitialSelectedCollections = (d) => {
	const resolution = d?.monthly ? 'monthly' : 'daily';
	const initialSelectedCollections = {
		stitch: false,
		onlyForecast: false,
		onlyProduction: false,
	};

	// set the first available collection as checked
	if (d) {
		const keys = Object.keys(initialSelectedCollections);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (d[resolution][key]) {
				initialSelectedCollections[key] = true;
				break;
			}
		}
	}
	return initialSelectedCollections;
};

const RollUpChartDialog = (props) => {
	const {
		chartId = 'roll-up-chart',
		close,
		comparisonIds = [],
		data,
		rollUpType = 'scenario',
		runId,
		titleItems = [],
		visible,
	} = props;

	const [category, setCategory] = useState('Gross Well Head');
	const [isComparisonActive, setIsComparisonActive] = useState(false);
	const [resolution, setResolution] = useState('monthly');
	const [yLogScale, setYLogScale] = useState(true);

	const hasComparisons = comparisonIds?.length;

	const hasDaily = data?.daily;
	const hasMonthly = data?.monthly;
	const disabledResolutionTooltipTitle =
		(!hasDaily && 'No daily data available') || (!hasMonthly && 'No monthly data available');

	const toggleResolution = useCallback(() => setResolution((prev) => (prev === 'monthly' ? 'daily' : 'monthly')), []);

	const [selectedCollections, setSelectedCollections] = useMergedState({
		stitch: false,
		onlyForecast: false,
		onlyProduction: false,
	});

	const exportType = useMemo(
		() => (isComparisonActive ? 'Export Comparison CSV' : 'Export Aggregate CSV'),
		[isComparisonActive]
	);

	const getCSVDownload = useCallback(async () => {
		if (runId) {
			try {
				const rollUpRoute = rollUpType === 'scenario' ? 'scenarios' : 'forecast';
				const {
					success,
					file_id: fileId,
					message,
				} = await postApi(`/${rollUpRoute}/downloadRollUp/${runId}`, {
					selectedCollections,
					resolution,
					hasComparison: isComparisonActive,
				});

				if (success) {
					downloadFile(fileId);
					infoAlert(message ?? 'Successfully exported CSV');
				} else {
					failureAlert(message ?? 'Failed to export CSV');
				}
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	}, [rollUpType, runId, selectedCollections, resolution, isComparisonActive]);

	const { refetch: fetchDownload, isFetching: downloadIsFetching } = useQuery(
		['rollup', 'export-csv', runId],
		getCSVDownload,
		{ enabled: false }
	);

	const disableCSVDownload = !data?.[resolution];

	const { data: comparisonData } = useQuery(
		['forecast', 'rollup', 'comparison-data', comparisonIds, data],
		() => {
			return getApi('/forecast/getRollUpsByForecastId', { forecastIds: comparisonIds });
		},
		{ enabled: isComparisonActive && !!comparisonIds?.length, defaulted: [] }
	);

	useEffect(() => {
		if (visible) {
			// HACK: delay the initial selectedCollections so that the chart renders after the dialog is fully visible / rendered
			setTimeout(() => setSelectedCollections(getInitialSelectedCollections(data)), 500);
		} else {
			setIsComparisonActive(false);
			setResolution('monthly');
		}
	}, [data, setSelectedCollections, visible]);

	useEffect(() => {
		const initHasDaily = data?.daily;
		const initHasMonthly = data?.monthly;

		if (initHasDaily && !initHasMonthly) {
			setResolution('daily');
		}
	}, [data?.daily, data?.monthly, visible]);

	return (
		<FullScreenDialog
			id='roll-up-chart-dialog'
			open={visible}
			disableTopbar
			disableContentExtraTopPadding
			actions={
				<>
					<Button onClick={close}>Close</Button>
					<Button
						color='primary'
						disabled={!runId || downloadIsFetching || disableCSVDownload}
						onClick={fetchDownload}
					>
						{exportType}
					</Button>
				</>
			}
		>
			<RollUpChartContainer>
				<ChartControls>
					<Box display='flex' alignItems='center'>
						<Box fontSize='1rem'>{genTitle(titleItems)}</Box>

						<Box marginX='1rem'>
							<Button onClick={() => setYLogScale((prev) => !prev)} color='primary'>
								{yLogScale ? 'Y-Axis Log' : 'Y-Axis Linear'}
							</Button>

							<Button
								disabled={(!hasDaily || !hasMonthly) && disabledResolutionTooltipTitle}
								onClick={toggleResolution}
								color='primary'
							>
								{capitalize(resolution)}
							</Button>
						</Box>

						<Box marginRight='1rem' display='flex' alignItems='center'>
							<InfoIcon
								withRightMargin
								tooltipTitle='Checkboxes enabled when selected on generate screen and make them available upon CSV export. Selections on "Actual or Forecast" tab determine availability of "production" data'
							/>
							{['stitch', 'onlyForecast', 'onlyProduction'].map((value) => (
								<CheckboxField
									key={value}
									label={COLLECTION_TEMPLATE[value].label}
									checked={selectedCollections[value]}
									disabled={data?.[resolution] ? !data?.[resolution]?.[value] : true}
									onClick={() =>
										setSelectedCollections((curState) => ({
											[value]: !curState[value],
										}))
									}
								/>
							))}
						</Box>

						{rollUpType === 'forecast' && (
							<InfoTooltipWrapper tooltipTitle='Turn on roll-up comparison'>
								<SwitchField
									color='primary'
									disabled={!hasComparisons && 'No comparison forecasts selected'}
									label='Compare'
									labelPlacement='start'
									onClick={() => setIsComparisonActive((p) => !p)}
									value={isComparisonActive}
								/>
							</InfoTooltipWrapper>
						)}
					</Box>

					{rollUpType === 'scenario' && (
						<LabeledSelectField
							label='Category'
							menuItems={Object.keys(categoryKeys)}
							onChange={setCategory}
							value={category}
						/>
					)}
				</ChartControls>
				<Divider />

				<ForecastChartContainer
					category={category}
					categoryKeys={categoryKeys}
					chartId={chartId}
					chartSettings={{ yLogScale, yearsPast: 'all' }}
					comparisonData={comparisonData}
					data={data}
					enableXMinMax
					enableYMinMax
					isComparisonActive={isComparisonActive}
					render={RollUpChart}
					resolution={resolution}
					rollUpType={rollUpType}
					selectedCollections={selectedCollections}
					yBigItems
				/>
			</RollUpChartContainer>
		</FullScreenDialog>
	);
};

export default RollUpChartDialog;
