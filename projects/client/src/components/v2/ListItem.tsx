import { ListItem as MUListItem, ListItemProps as MUListItemProps } from '@material-ui/core';
import { forwardRef } from 'react';

import { withDisabledTooltip, withPointerEvents, withTooltip } from './helpers';

// NOTE: v5 of MUI fixes this issue due to separation of ListItem and ListItemButton components; currently almost all of our components rely on ListItem being ButtonBase
const ListItem = withDisabledTooltip(
	withTooltip(
		withPointerEvents(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			forwardRef<any, MUListItemProps>(({ button = true, ...props }, ref) => (
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				<MUListItem ref={ref} {...props} button={button} />
			))
		)
	)
);

export default ListItem;
