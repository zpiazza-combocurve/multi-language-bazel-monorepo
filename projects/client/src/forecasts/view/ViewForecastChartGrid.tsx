import { useMemo } from 'react';

import SimplePhaseChart from '@/forecasts/charts/components/SimplePhaseChart';
import { CardsLayout } from '@/layouts/CardsLayout';

function ViewForecastChartGrid({ bucket, data, graphSettings, phase, resolution, showLoadStatus, toggleManualSelect }) {
	const chartRender = useMemo(
		() =>
			data.map((value, i) => (
				<SimplePhaseChart
					key={i}
					enableLabels
					graphSettings={graphSettings}
					phase={phase}
					prodFreq={resolution}
					selected={bucket.has(value.headers._id)}
					showLoadStatus={showLoadStatus}
					toggleManualSelect={toggleManualSelect}
					well={value}
				/>
			)),
		[bucket, data, graphSettings, phase, resolution, showLoadStatus, toggleManualSelect]
	);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	return <CardsLayout id='forecast-chart-grid-container'>{chartRender}</CardsLayout>;
}

export default ViewForecastChartGrid;
