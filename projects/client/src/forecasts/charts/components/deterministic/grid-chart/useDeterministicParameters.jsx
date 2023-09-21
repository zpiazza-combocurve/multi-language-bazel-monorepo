import { useMemo, useState } from 'react';

import { ForecastFloaterButton } from '@/forecasts/shared/ForecastFloater';
import ForecastParameters, {
	ParametersTitleWithSubtext,
	getForecastParameterProps,
} from '@/forecasts/shared/ForecastParameters';

const useDeterministicParameters = (rawChartData, wellName) => {
	const [phase, setPhase] = useState('oil');

	const parameterProps = useMemo(
		() =>
			rawChartData
				? {
						dailyProduction: rawChartData?.daily,
						monthlyProduction: rawChartData?.monthly,
						parentResolution: rawChartData?.forecast?.[phase]?.data_freq,
						phase,
						setPhase,
						title: wellName?.length ? (
							<ParametersTitleWithSubtext title={wellName} subText='Well Name' />
						) : null,
						useHandle: true,
						...getForecastParameterProps(rawChartData?.forecast, phase, 'deterministic'),
				  }
				: null,
		[phase, rawChartData, wellName]
	);

	const render = parameterProps ? (
		<ForecastFloaterButton useHandle tooltipPlacement='left'>
			<ForecastParameters {...parameterProps} />
		</ForecastFloaterButton>
	) : null;

	return {
		parameterProps,
		render,
	};
};

export default useDeterministicParameters;
