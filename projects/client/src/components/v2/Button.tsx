import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Icon, useTheme } from '@material-ui/core';
import MUButton, { ButtonProps as MUButtonProps } from '@material-ui/core/Button';
import * as React from 'react';

import { withCustomColors, withDisabledTooltip, withPointerEvents, withTooltip } from './helpers';

/**
 * HACK to use the correct font size, aiming to fix the icon inside Button.startIcon and Button.endIcon
 *
 * @see https://github.com/mui-org/material-ui/pull/17600
 * @see https://github.com/mui-org/material-ui/blob/v4.11.0/packages/material-ui/src/Button/Button.js#L249
 */
function VariableSizeIcon({ children, ...props }) {
	const theme = useTheme();
	const fontSize = theme.typography.h6.fontSize;
	return (
		<Icon
			{...props}
			css={`
				&&& {
					font-size: ${fontSize};
					display: flex; // HACK
					align-items: center;
					justify-content: center;
				}
			`}
		>
			<FontAwesomeIcon
				css={`
					font-size: calc(1em - 4px);
				`}
				icon={children}
			/>
		</Icon>
	);
}

const Button = withCustomColors(
	withDisabledTooltip(
		withTooltip(
			withPointerEvents(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				React.forwardRef<any, MUButtonProps>(({ startIcon, endIcon, ...props }, ref) => (
					<MUButton
						ref={ref}
						{...props}
						startIcon={startIcon ? <VariableSizeIcon>{startIcon}</VariableSizeIcon> : undefined}
						endIcon={endIcon ? <VariableSizeIcon>{endIcon}</VariableSizeIcon> : undefined}
					/>
				))
			)
		)
	)
);

export type ButtonProps = React.ComponentPropsWithRef<typeof Button>;

export default Button;
