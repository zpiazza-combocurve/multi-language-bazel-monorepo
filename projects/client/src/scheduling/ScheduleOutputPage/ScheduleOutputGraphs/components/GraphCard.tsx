import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { capitalize } from 'lodash';
import { useState } from 'react';

import { Autocomplete, IconButton } from '@/components/v2';
import { zingchart } from '@/helpers/zingchart/entry';
import { Construction } from '@/inpt-shared/scheduling/shared';
import { useScheduleConstruction } from '@/scheduling/ScheduleLandingPage/hooks/useScheduleConstruction';
import { Card } from '@/scheduling/components/Card';

import { MapGraph } from '../MapGraph';
import { WellDeliveryGraph } from '../WellDeliveryGraph';
import { CHART_OPTIONS, ChartOption, Options } from '../chart-options';
import { Resolution } from '../hooks/useOutputGraph';

export type Position = 'left' | 'right';

type GraphCardProps = {
	scheduleId: Inpt.ObjectId;
	wellIds: Inpt.ObjectId[];
	position: Position;
	defaultChart: Options;
	refetch: boolean;
	setRefetch: React.Dispatch<React.SetStateAction<boolean>>;
};

type GetChartProps = Omit<GraphCardProps, 'defaultChart'> & {
	construction: Construction | null;
	resolution: Resolution;
	chartId: string;
};

const getSelectedGraph = (selectedGraph: ChartOption, props: GetChartProps) => {
	switch (selectedGraph._id) {
		case 'well-delivery-chart':
			return <WellDeliveryGraph {...props} />;
		case 'map':
			return <MapGraph {...props} />;
		default:
			return <WellDeliveryGraph {...props} />;
	}
};

export const GraphCard = ({ scheduleId, wellIds, refetch, setRefetch, position, defaultChart }: GraphCardProps) => {
	const [selectedGraph, setSelectedGraph] = useState<ChartOption>(
		CHART_OPTIONS.find(({ _id }) => _id === defaultChart) || CHART_OPTIONS[0]
	);
	const [resolution, setResolution] = useState<Resolution>('month');

	const { data: construction } = useScheduleConstruction(scheduleId);

	const chartId = `${selectedGraph._id}-${position}`;

	const handleExportChart = () => {
		const filetype = 'pdf';
		zingchart.exec(chartId, 'exportimage', {
			filename: `${chartId}.${filetype}`,
			download: true,
			filetype,
		});
	};

	return (
		<Card
			css={`
				padding: 1rem 0;
			`}
			leftHeader={
				<Autocomplete
					css={`
						min-width: 12rem;
					`}
					variant='outlined'
					size='small'
					options={CHART_OPTIONS}
					getOptionLabel={({ name }) => name}
					value={selectedGraph}
					blurOnSelect
					color='secondary'
					disableClearable
					InputProps={{ color: 'secondary' }}
					InputLabelProps={{ color: 'secondary' }}
					onChange={(_, chart) => setSelectedGraph(chart)}
				/>
			}
			rightHeader={
				<>
					<Autocomplete
						css={`
							margin-right: 1rem;
							.MuiAutocomplete-inputRoot[class*='MuiInput-root'][class*='MuiInput-marginDense']
								.MuiAutocomplete-input:first-child {
								padding: 0;
							}
							.MuiInputBase-input {
								width: 55px;
							}
						`}
						variant='standard'
						size='small'
						options={['month', 'quarter', 'year']}
						getOptionLabel={(name) => capitalize(name)}
						value={resolution}
						onChange={(_, resolution) => setResolution(resolution)}
						blurOnSelect
						color='secondary'
						disableClearable
						InputProps={{ color: 'secondary', disableUnderline: true }}
					/>
					{selectedGraph._id !== 'map' && (
						<IconButton
							css='margin-right: 0.5rem'
							iconSize='small'
							size='small'
							onClick={handleExportChart}
							aria-label='Export Well Delivery Chart Button'
						>
							{faDownload}
						</IconButton>
					)}
				</>
			}
		>
			{getSelectedGraph(selectedGraph, {
				scheduleId,
				construction,
				wellIds,
				refetch,
				setRefetch,
				resolution,
				position,
				chartId,
			})}
		</Card>
	);
};
