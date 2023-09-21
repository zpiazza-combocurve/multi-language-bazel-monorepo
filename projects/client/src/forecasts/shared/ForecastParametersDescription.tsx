import { useEffect, useState } from 'react';

import ForecastFloater, { FORECAST_FLOATER_HANDLE, TooltipContainer } from '@/forecasts/shared/ForecastFloater';
import ForecastParameters from '@/forecasts/shared/ForecastParameters';
import { theme } from '@/helpers/styled';

const ParametersDescriptionWithFloater = (props) => {
	const { phase, setPhase, ...rest } = props;

	const [detached, setDetached] = useState(false);
	const [floaterColor, setFloaterColor] = useState(null);
	const handleToggle = () => setDetached((u) => !u);

	useEffect(() => {
		setFloaterColor(theme[`${phase}Color`]);
	}, [phase]);

	return (
		<ForecastFloater
			borderColor={floaterColor}
			detached={detached}
			disableToolbar
			handle={FORECAST_FLOATER_HANDLE}
			minimal={!detached}
			onToggle={handleToggle}
			visible
		>
			<TooltipContainer>
				<ForecastParameters
					enablePhaseSelection={detached}
					handleToggle={handleToggle}
					phase={phase}
					setPhase={detached ? setPhase : undefined}
					useHandle
					{...rest}
				/>
			</TooltipContainer>
		</ForecastFloater>
	);
};

export { ParametersDescriptionWithFloater };
