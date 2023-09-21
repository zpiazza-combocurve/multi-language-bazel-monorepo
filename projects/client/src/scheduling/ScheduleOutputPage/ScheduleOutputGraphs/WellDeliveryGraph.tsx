import { faChartArea, faChartBar, faChartLine } from '@fortawesome/pro-regular-svg-icons';
import { useTheme } from '@material-ui/core';
import { useQuery } from 'react-query';

import { Placeholder, Zingchart } from '@/components';
import { Box, IconButton } from '@/components/v2';
import { ZingchartData } from '@/helpers/zing';
import { Construction } from '@/inpt-shared/scheduling/shared';

import { WellDeliveryData, getWellDeliveryData } from '../api';
import { StyledSlider } from './components/StyledSlider';
import { Resolution, useOutputGraph } from './hooks/useOutputGraph';
import { getDefaultColorIndex, getGraphMarks, scaleXFormatter } from './shared';

type WellDeliveryGraphProps = {
	scheduleId: Inpt.ObjectId;
	construction: Construction | null;
	wellIds: Inpt.ObjectId[];
	refetch: boolean;
	setRefetch: React.Dispatch<React.SetStateAction<boolean>>;
	resolution: Resolution;
	chartId: string;
};

type ZingchartDataWithScroll = ZingchartData & {
	scrollX: {
		bar: {
			backgroundColor: string;
			alpha: number;
		};
	};
};

enum COLORS {
	PINK = '#ef476f',
	BLUE = '#26547c',
	YELLOW = '#ffd166',
	GREEN = '#06d6a0',
}

export const WellDeliveryGraph = ({
	scheduleId,
	construction,
	wellIds,
	refetch,
	setRefetch,
	resolution,
	chartId,
}: WellDeliveryGraphProps) => {
	const { chartType, sliderRange, setChartType, setSliderRange } = useOutputGraph();

	const theme = useTheme();

	const { data, isLoading } = useQuery(
		['well-delivery-data', scheduleId, resolution, refetch],
		() =>
			(getWellDeliveryData(scheduleId, wellIds, resolution) as Promise<WellDeliveryData>).then((data) => {
				setSliderRange([0, data.allPeriods.length - 1]);
				setRefetch(false);
				return data;
			}),
		{ enabled: !!wellIds.length }
	);

	const { wellDeliveryData, allPeriods, highestValue } = data || {
		wellDeliveryData: [],
		allPeriods: [],
		highestValue: 0,
	};

	const handleChange = (_, newValue: number | number[]) => {
		setSliderRange(newValue as number[]);
	};

	const colors = Object.values(COLORS);
	const nextColor = getDefaultColorIndex(colors.length);

	const filterByIndex = (data) => data.filter((_, index) => !(sliderRange[0] > index || sliderRange[1] < index));

	return (
		<Placeholder loading={isLoading}>
			<Box height='100%'>
				<div
					css={`
						height: calc(100% - 55px);
						display: flex;
					`}
				>
					<Zingchart
						id={chartId}
						rerenderOnModify
						disableContextMenu
						data={
							{
								type: chartType,
								legend: {
									visible: true,
									alpha: 1,
									backgroundColor: theme.palette.background.opaque,
									borderRadius: 4,
									header: {
										backgroundColor: theme.palette.background.opaque,
									},
								},
								scaleX: {
									labels: filterByIndex(allPeriods).map((value) =>
										scaleXFormatter(value, resolution)
									),
								},
								scrollX: {
									bar: {
										backgroundColor: theme.palette.background.opaque,
									},
								},
								scaleY: {
									values: `0:${highestValue}`,
									minorTicks: 0,
								},
								series: Object.keys(wellDeliveryData || {}).map((stepName) => {
									const colorByIndex = colors[nextColor()];

									const backgroundColor =
										construction?.scheduleSettings.activitySteps.find(
											(step) => step.name === stepName
										)?.color ?? colorByIndex;

									return {
										values: filterByIndex(allPeriods).map(
											(period) => wellDeliveryData[stepName][period] ?? 0
										),
										decimals: 0,
										text: stepName,
										backgroundColor,
									};
								}),
							} as ZingchartDataWithScroll
						}
					/>

					<div
						css={`
							display: flex;
							flex-direction: column;
						`}
					>
						<IconButton
							css={`
								margin-bottom: 0.5rem;
							`}
							onClick={() => setChartType('bar')}
							size='small'
							iconSize='small'
						>
							{faChartBar}
						</IconButton>
						<IconButton
							css={`
								margin-bottom: 0.5rem;
							`}
							onClick={() => setChartType('line')}
							size='small'
							iconSize='small'
						>
							{faChartLine}
						</IconButton>
						<IconButton onClick={() => setChartType('area')} size='small' iconSize='small'>
							{faChartArea}
						</IconButton>
					</div>
				</div>

				<StyledSlider
					color='secondary'
					getAriaLabel={() => 'Well Delivery Range'}
					getAriaValueText={(value) => String(value)}
					valueLabelDisplay='auto'
					valueLabelFormat={(value) => scaleXFormatter(allPeriods[value], resolution)}
					value={sliderRange.length ? sliderRange : [0, allPeriods.length - 1]}
					onChange={handleChange}
					max={allPeriods.length - 1}
					marks={getGraphMarks(allPeriods, resolution)}
				/>
			</Box>
		</Placeholder>
	);
};
