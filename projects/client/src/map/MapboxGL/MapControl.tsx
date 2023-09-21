import classNames from 'classnames';
import { useContext, useEffect, useMemo, useState } from 'react';
import * as React from 'react';
import ReactDOM from 'react-dom';

import { addHOCName } from '@/components/shared';

import { Position } from './MapNativeControl';
import { MapboxGLContext } from './context';

export const DEFAULT_POSITION = 'top-right' as Position;
export const MapControlContext = React.createContext<{ position: Position }>({ position: DEFAULT_POSITION });

interface MapControlProps {
	children: React.ReactNode;
	position?: Position;
	className?: string;
}

/**
 * React + custom map control integration
 *
 * @example
 * 	<MapboxGL>
 * 		<MapControl position='bottom-right'>Custom Legend</MapControl>
 * 	</MapboxGL>;
 *
 * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addcontrol
 * @see https://docs.mapbox.com/mapbox-gl-js/api/markers/#icontrol
 */
function MapControl({ children, position = DEFAULT_POSITION, className }: MapControlProps) {
	const { map } = useContext(MapboxGLContext);

	const [container] = useState(() => document.createElement('div'));

	useEffect(() => {
		if (!map) {
			return;
		}

		container.className = classNames('mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-group-custom', className);

		const control = {
			onAdd: () => container,
			onRemove: () => container.parentNode?.removeChild(container),
		};

		map.addControl(control, position);

		return () => {
			map.removeControl(control);
		};
	}, [container, className, position, map]);

	return (
		<MapControlContext.Provider value={useMemo(() => ({ position }), [position])}>
			{ReactDOM.createPortal(children, container)}
		</MapControlContext.Provider>
	);
}

/** Will wrap the component with a MapControl */
export function withMapControl<P>(Component: React.ComponentType<P>) {
	type ComponentExProps = P & { mapControlPosition?: Position };
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	function ComponentEx({ mapControlPosition, ...props }: ComponentExProps, ref: React.ForwardedRef<any>) {
		return (
			<MapControl position={mapControlPosition}>
				<Component ref={ref} {...(props as P)} />
			</MapControl>
		);
	}
	return addHOCName(React.forwardRef(ComponentEx), 'withMapControl', Component);
}

export default MapControl;
