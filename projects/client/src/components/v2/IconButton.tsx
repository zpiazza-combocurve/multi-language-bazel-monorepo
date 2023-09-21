import MUIBadge, { BadgeProps as MUIBadgeProps } from '@material-ui/core/Badge';
import MUIIconButton, { IconButtonProps as MUIIconButtonProps } from '@material-ui/core/IconButton';
import { ComponentProps, ComponentType, forwardRef } from 'react';

import Icon from './Icon';
import {
	CustomColorsProps,
	DisabledTooltipProps,
	TooltipProps,
	withCustomColors,
	withDisabledTooltip,
	withPointerEvents,
	withTooltip,
} from './helpers';

function IconButton(
	{
		children,
		badgeProps,
		iconSize,
		...props
	}: ComponentProps<typeof MUIIconButton> & { badgeProps?: ComponentProps<typeof MUIBadge>; iconSize?: 'small' },
	ref
) {
	const icon = (
		<Icon
			fontSize={iconSize}
			css={`
				height: 1em;
				width: 1em;
			`}
		>
			{children}
		</Icon>
	);
	return (
		<MUIIconButton ref={ref} {...props}>
			{badgeProps ? <MUIBadge {...badgeProps}>{icon}</MUIBadge> : icon}
		</MUIIconButton>
	);
}

export type IconButtonProps = Assign<
	MUIIconButtonProps,
	CustomColorsProps & DisabledTooltipProps & TooltipProps & { badgeProps?: MUIBadgeProps; iconSize?: 'small' }
>;

/**
 * Refer to the [Icons](https://material-ui.com/components/icons/) section of the documentation regarding the available
 * icon options. Demos:
 *
 * - [Buttons](https://material-ui.com/components/buttons/)
 *
 * API:
 *
 * - [IconButton API](https://material-ui.com/api/icon-button/)
 * - Inherits [ButtonBase API](https://material-ui.com/api/button-base/)
 */
export default withCustomColors(
	withDisabledTooltip(withTooltip(withPointerEvents(forwardRef(IconButton))))
) as ComponentType<IconButtonProps>;
