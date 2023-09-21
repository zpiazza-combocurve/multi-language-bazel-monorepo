import { useTheme } from '@material-ui/core';
import { memo, useMemo } from 'react';

import { Placeholder } from '@/components';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { Card, CardsLayout } from '@/layouts/CardsLayout';

import ForecastChartContainer from '../charts/components/ForecastChartContainer';
import ForecastComparisonGridChart from '../charts/components/comparison/ForecastComparisonGridChart';
import DeterministicGridChart from '../charts/components/deterministic/grid-chart/DeterministicGridChart';
import { VerticalDateItem } from '../charts/components/vertical-date-bar/helpers';
import { ChartSettings } from '../charts/useChartSettings';
import { SeriesItem } from './manual/ManualChartProps';

const gridChartRender = (thisProps) => <DeterministicGridChart {...thisProps} />;

const comparisonGridChartRender = (thisProps) => <ForecastComparisonGridChart {...thisProps} />;

const EMPTY_ARR = [];

interface GridAreaRenderProps {
	chartSettings: ChartSettings;
	comparisonIds: Array<string>;
	comparisonResolutions: Array<string>;
	curWellIds: Array<string>;
	dateBarItems: Array<VerticalDateItem>;
	enableDateBarItems: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dataSettings: any;
	forecastId: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getAdditionalChartActions: (value: string) => any;
	getHighlight?: (value: string) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	gridChartData: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	handleSelectionForecastMap: Array<any>;
	isComparisonActive?: boolean;
	loading?: boolean;
	refreshChart: (value: string) => void;
	seriesItems: Array<SeriesItem>;
}

const GridAreaRender = ({
	chartSettings,
	comparisonIds,
	comparisonResolutions,
	curWellIds,
	dataSettings,
	dateBarItems,
	enableDateBarItems,
	forecastId,
	getAdditionalChartActions,
	getHighlight,
	gridChartData,
	handleSelectionForecastMap,
	isComparisonActive,
	loading,
	refreshChart,
	seriesItems,
}: GridAreaRenderProps) => {
	const theme = useTheme();
	const { isVerticalDateBarsEnabled } = useLDFeatureFlags();

	const isLoading = !curWellIds.length || loading;

	const chartRender = isComparisonActive ? comparisonGridChartRender : gridChartRender;

	const renderProps = useMemo(() => {
		if (isLoading) {
			return null;
		}

		const sharedProps = {
			dataSettings,
			dateBarItems: enableDateBarItems && isVerticalDateBarsEnabled ? dateBarItems : EMPTY_ARR,
			enableDownload: true,
			enableFilterSelection: true,
			enableParameterDescription: true,
			enableProximity: true,
			limitHeaders: curWellIds.length > 4,
			selectable: true,
			seriesItems,
		};

		if (isComparisonActive) {
			return {
				...sharedProps,
				comparisonIds,
				comparisonResolutions,
				refForecastId: forecastId,
			};
		}

		return {
			...sharedProps,
			forecastId,
		};
	}, [
		comparisonIds,
		comparisonResolutions,
		curWellIds.length,
		dataSettings,
		dateBarItems,
		enableDateBarItems,
		forecastId,
		isComparisonActive,
		isLoading,
		isVerticalDateBarsEnabled,
		seriesItems,
	]);

	if (isLoading) {
		return (
			<Placeholder
				empty={!curWellIds?.length}
				emptySize={2}
				loading={loading}
				loadingText='Fetching Forecasts...'
				main
				text='No Wells To Display...'
			/>
		);
	}

	return (
		<CardsLayout
			/**
			 * Always fit all charts in two rows, which is elements divided by 2 except for 2 charts which is 2 per row,
			 * so:
			 *
			 *     				| charts | charts per row |
			 *     				|--------+----------------|
			 *     				|      1 |              1 |
			 *     				|      2 |              2 |
			 *     				|      4 |              2 |
			 *     				|      6 |              3 |
			 *     				|      8 |              4 |
			 */
			elementsPerRow={Math.max(2, Math.ceil(curWellIds.length / 2))}
		>
			{curWellIds.map((wellId, idx) => {
				const id = `deterministic-${idx}`;
				const additionalActions = getAdditionalChartActions(wellId);
				return (
					<Card
						disableHeader
						key={id}
						noPadding
						css={`
							padding-right: 0.5rem;
							${getHighlight?.(wellId) &&
							`box-shadow: 0 0 5px ${
								theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'
							};`}
						`}
					>
						<ForecastChartContainer
							{...renderProps}
							{...{
								additionalActions,
								chartData: gridChartData[wellId],
								chartId: id,
								disableDataQuery: true,
								onHandleSelection: handleSelectionForecastMap[idx],
								refreshGridChart: () => refreshChart(wellId),
								render: chartRender,
								wellId,
							}}
							chartSettings={chartSettings}
						/>
					</Card>
				);
			})}
		</CardsLayout>
	);
};

export default memo(GridAreaRender);
