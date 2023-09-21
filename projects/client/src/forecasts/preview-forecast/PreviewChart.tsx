import { useCallback, useMemo } from 'react';

import { Divider, SwitchItem } from '@/components/v2';
import SingleChartControls from '@/forecasts/charts/components/deterministic/grid-chart/SingleChartControls';
import { capitalize } from '@/helpers/text';
import { forecastSeries } from '@/helpers/zing';
import { CardsLayout } from '@/layouts/CardsLayout';

import SimplePhaseChart from '../charts/components/SimplePhaseChart';
import {
	ChartResolutionSubMenu,
	ForecastChartOptionsMenu,
	YMaxSubMenu,
	YMinSubMenu,
	YearsBeforeSubMenu,
	YearsPastSubMenu,
} from '../shared';

export function ChartMenu({ resolution, toggleResolution, chartOptions, setChartOption }) {
	const fieldProps = (name: keyof typeof chartOptions) => {
		const value = chartOptions[name];
		const onChange = (newValue) => setChartOption(name, newValue);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		return { value, onChange, onSelect: onChange } as any;
	};
	return (
		<ForecastChartOptionsMenu disableLabel tooltipPosition='right'>
			<ChartResolutionSubMenu {...fieldProps('chartResolution')} />

			<YearsBeforeSubMenu {...fieldProps('yearsBefore')} />

			<YearsPastSubMenu {...fieldProps('yearsPast')} />

			<YMaxSubMenu {...fieldProps('yMax')} />

			<YMinSubMenu {...fieldProps('yMin')} />

			<Divider />

			<SwitchItem label='Toggle Production Line Plot' {...fieldProps('lineScatter')} />

			<SwitchItem
				label={`Toggle Resolution (${capitalize(resolution)})`}
				onChange={toggleResolution}
				value={resolution === 'daily'}
			/>

			<SwitchItem label='Y-Axis Log Scale' {...fieldProps('logScale')} />

			<SwitchItem label='X-Axis Log Scale' {...fieldProps('xLogScale')} />
		</ForecastChartOptionsMenu>
	);
}

export default function PreviewChart({
	adjustEdit,
	chartOptions,
	className,
	comparisonKey,
	comparisonProps,
	forceExitReload,
	forecastPreview: forecast,
	phase,
	resolution,
	setChartOption,
	setComparisonProps,
	toggleResolution,
}: {
	adjustEdit;
	chartOptions;
	className?: string;
	comparisonKey?;
	comparisonProps?;
	forceExitReload?;
	forecastPreview;
	phase: string;
	resolution: string;
	setChartOption;
	setComparisonProps?;
	toggleResolution;
}) {
	const generateChartOptions = useCallback(() => {
		return (
			<ChartMenu
				resolution={resolution}
				toggleResolution={toggleResolution}
				chartOptions={chartOptions}
				setChartOption={setChartOption}
			/>
		);
	}, [resolution, toggleResolution, chartOptions, setChartOption]);

	const forecastType = forecast.forecast?.type;

	const probabilisticGraphSettings = useMemo(() => {
		const pDictKeys = Object.keys(forecast.data[phase].P_dict);
		return {
			...chartOptions,
			allPName: chartOptions.pKey,
			sNames: forecastSeries.filter(({ value }) => pDictKeys.includes(value)).map(({ value }) => value),
		};
	}, [chartOptions, forecast.data, phase]);

	return (
		<div className={className}>
			{forecastType === 'probabilistic' ? (
				<SimplePhaseChart
					css='height: 100%;'
					enableDownload={Boolean(forecast?.forecast)}
					getChartOptions={generateChartOptions}
					graphSettings={probabilisticGraphSettings}
					phase={chartOptions.chartType === 'all' ? 'all' : phase}
					prodFreq={resolution}
					selectable
					selected={forecast.inEdit}
					toggleManualSelect={adjustEdit}
					well={{ ...forecast, _id: forecast.wellId, forecastId: forecast?.forecast?._id }} // TODO: hacky will need to unify later
				/>
			) : (
				<CardsLayout>
					<SingleChartControls
						enableComparison={Boolean(comparisonProps?.ids)}
						comparisonIds={comparisonProps?.ids}
						comparisonKey={comparisonKey}
						comparisonResolutions={comparisonProps?.resolutions}
						enableDownload={Boolean(forecast?.forecast)}
						forecastId={forecast?.forecast?._id}
						onForecastConfirm={forceExitReload}
						setComparisonProps={setComparisonProps}
						wellId={forecast?.wellId}
						nested
					/>
				</CardsLayout>
			)}
		</div>
	);
}
