import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import { forwardRef } from 'react';

import { addHOCName } from '../shared';

export interface WithTooltipProps {
	tooltipTitle?: TooltipProps['title'];
	tooltipPlacement?: TooltipProps['placement'];
	tooltipEnterDelay?: TooltipProps['enterDelay'];
}

/**
 * @example
 * 	import MuiIconButton from '@mui/material/IconButton';
 * 	import { withTooltip } from '@/components/v5/tooltip-helper.tsx';
 *
 * 	const IconButton = withTooltip(MuiIconButton);
 *
 * 	<IconButton tooltipTitle='Tooltip title' {...iconButtonProps} />;
 */
export function withTooltip<P>(Component: React.ComponentType<P>) {
	function WithTooltipComponent(props: P & WithTooltipProps, ref: React.Ref<unknown>) {
		const { tooltipTitle, tooltipEnterDelay, tooltipPlacement, ...rest } = props;
		if (tooltipTitle) {
			return (
				<Tooltip title={tooltipTitle} enterDelay={tooltipEnterDelay} placement={tooltipPlacement}>
					<Component ref={ref} {...(rest as P)} />
				</Tooltip>
			);
		} else {
			return <Component ref={ref} {...(rest as P)} />;
		}
	}

	return addHOCName(forwardRef(WithTooltipComponent), 'withTooltip', Component);
}
