import ToggleButton, { ToggleButtonProps } from '@mui/material/ToggleButton';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import { VFC, forwardRef } from 'react';

type TooltipToggleButtonProps = ToggleButtonProps & {
	TooltipProps: Omit<TooltipProps, 'children'>;
};

// Catch props and forward to ToggleButton
const TooltipToggleButton: VFC<TooltipToggleButtonProps> = forwardRef(({ TooltipProps, ...props }, ref) => {
	return (
		<Tooltip {...TooltipProps}>
			<ToggleButton ref={ref} {...props} />
		</Tooltip>
	);
});

export default TooltipToggleButton;
