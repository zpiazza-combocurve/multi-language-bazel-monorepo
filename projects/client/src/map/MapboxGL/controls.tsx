// https://docs.mapbox.com/mapbox-gl-js/api/markers/#icontrol
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';

import { TooltipProps, withTooltip } from '@/components/v2/helpers';
import { withPopup } from '@/components/v2/menu';

import { withMapControl } from './MapControl';

type ButtonProps = React.ComponentPropsWithoutRef<'button'> & TooltipProps;

const Button = withTooltip('button') as React.ComponentType<ButtonProps>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type MapControlButtonProps = ButtonProps & { children: any };

function MapIconButton({ children, ...props }: MapControlButtonProps) {
	return (
		<Button type='button' className='mapboxgl-ctrl-icon' {...props}>
			<FontAwesomeIcon icon={children} />
		</Button>
	);
}

/**
 * IconButton as a mapboxgl control
 *
 * @example
 * 	<MapboxGL>
 * 		<MapControlIconButton onClick={handleCenter}>{faLocation}</MapControlIconButton>
 * 	</MapboxGL>;
 */
export const MapControlIconButton = withMapControl(MapIconButton);

/**
 * MenuIconButton as a mapboxgl control.
 *
 * @example
 * 	<MapboxGL>
 * 		<MapControlMenuIconButton icon={faLocation}>
 * 			<ButtonItem label='Center Wells' onClick={handleCenterWells} />
 * 			<ButtonItem label='Show Heatmap' onClick={handleShowHeatmap} />
 * 			<SwitchItem label='Show Invalid' value={showingInvalid} onClick={handleToggleInvalid} />
 * 		</MapControlMenuIconButton>
 * 	</MapboxGL>;
 *
 * @note use items from @/components/v2/menu
 */
export const MapControlMenuIconButton = withMapControl(
	withPopup(MapIconButton, {
		disablePortal: false,
		placement: 'right-start',
		childrenKey: 'icon',
	})
);
