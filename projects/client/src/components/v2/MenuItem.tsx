import MenuItem, { MenuItemProps } from '@material-ui/core/MenuItem';
import * as React from 'react';

import { DisabledTooltipProps, TooltipProps, withDisabledTooltip, withPointerEvents, withTooltip } from './helpers';

export default withDisabledTooltip(withTooltip(withPointerEvents(MenuItem))) as <D extends React.ElementType, P>(
	props: Assign<MenuItemProps<D, P>, TooltipProps & DisabledTooltipProps>
) => JSX.Element;
