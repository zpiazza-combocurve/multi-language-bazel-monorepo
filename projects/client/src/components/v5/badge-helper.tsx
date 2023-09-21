import Badge, { BadgeProps } from '@mui/material/Badge';
import { forwardRef } from 'react';

import { addHOCName } from '../shared';

export interface WithBadgeProps {
	badgeProps?: BadgeProps;
}

/**
 * @example
 * 	import MuiIconButton from '@mui/material/IconButton';
 * 	import { withBadge } from '@/components/v5/badge-helpers';
 *
 * 	const IconButton = withBadge(MuiIconButton);
 *
 * 	<IconButton badgeProps={{ color: 'primary', badgeContent: 1 }} {...iconButtonProps} />;
 */
export function withBadge<P>(Component: React.ComponentType<P>) {
	function WithBadgeComponent(props: P & WithBadgeProps, ref: React.Ref<unknown>) {
		const { badgeProps, ...rest } = props;
		if (badgeProps) {
			return (
				<Badge {...badgeProps}>
					<Component ref={ref} {...(rest as P)} />
				</Badge>
			);
		} else {
			return <Component ref={ref} {...(rest as P)} />;
		}
	}

	return addHOCName(forwardRef(WithBadgeComponent), 'withBadge', Component);
}
