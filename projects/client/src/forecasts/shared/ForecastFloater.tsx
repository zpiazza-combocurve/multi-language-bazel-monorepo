import { faSlidersH } from '@fortawesome/pro-regular-svg-icons';
import { Children, cloneElement, useState } from 'react';
import styled from 'styled-components';

import { Floater } from '@/components';
import { IconButton } from '@/components/v2';
import { ifProp } from '@/helpers/styled';

const FORECAST_FLOATER_HANDLE = 'draggle-forecast-parameters';

const StyledFloater = styled(Floater)<{ leftStart?: string; topStart?: string; visible?: boolean }>`
	left: ${({ leftStart }) => leftStart ?? '2rem'};
	top: ${({ topStart }) => topStart ?? '4rem'};
	visibility: ${ifProp('visible', 'visible', 'hidden')};
`;

const TooltipContainer = styled.div`
	display: flex;
	flex-direction: column;
	padding-top: 0.5rem;
	row-gap: 0.5rem;
`;

const ForecastFloater = ({ borderColor, children, minimal = false, visible, width = '20rem', ...rest }) =>
	visible ? (
		<StyledFloater
			color={borderColor}
			detachIcon={faSlidersH}
			minimal={minimal}
			visible={visible}
			width={width}
			{...rest}
		>
			{children}
		</StyledFloater>
	) : null;

const ForecastFloaterButton = (props) => {
	const {
		children,
		color = 'primary',
		icon = faSlidersH,
		size = 'small',
		tooltipPlacement = 'bottom',
		tooltipTitle = 'View Parameters',
		useHandle,
		width = '20rem',
	} = props;

	const [floaterColor, setFloaterColor] = useState(null);
	const [visible, setVisible] = useState(false);
	const handleToggle = () => setVisible((u) => !u);

	return (
		<>
			<IconButton
				color={color}
				onClick={handleToggle}
				size={size}
				tooltipPlacement={tooltipPlacement}
				tooltipTitle={tooltipTitle}
			>
				{icon}
			</IconButton>

			<ForecastFloater
				borderColor={floaterColor}
				detached
				disableToolbar={useHandle}
				handle={useHandle && FORECAST_FLOATER_HANDLE}
				onToggle={handleToggle}
				visible={visible}
				width={width}
			>
				<TooltipContainer>
					{Children.map(children, (child) => cloneElement(child, { setFloaterColor, handleToggle }))}
				</TooltipContainer>
			</ForecastFloater>
		</>
	);
};

export default ForecastFloater;
export { TooltipContainer, ForecastFloaterButton, FORECAST_FLOATER_HANDLE };
