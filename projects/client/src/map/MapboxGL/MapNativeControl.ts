// https://docs.mapbox.com/mapbox-gl-js/api/markers/#icontrol
import mapboxgl from 'mapbox-gl';
import { MutableRefObject, useContext } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';

import { MapboxGLContext } from './context';

export type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * React + MapboxGL control integration
 *
 * @example
 * 	import mapboxgl from 'mapbox-gl';
 *
 * 	<MapboxGL>
 * 		<MapNativeControl control={mapboxgl.ScaleControl} unit='imperial' position='bottom-left' />
 * 		<MapNativeControl control={mapboxgl.NavigationControl} showCompass={false} showZoom position='top-right' />
 * 	</MapboxGL>;
 *
 * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addcontrol
 */
function MapNativeControl<T>(
	props: {
		control: { new (args: T): mapboxgl.Control | mapboxgl.IControl };
		position?: Position;
		controlRef?: MutableRefObject<InstanceType<(typeof props)['control']> | undefined>;
	} & T
) {
	const { map } = useContext(MapboxGLContext);
	useDeepCompareEffect(() => {
		if (!map) {
			// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
			return () => {};
		}
		const { controlRef, position, control: Control, ...args } = props;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const control = new Control(args as any);
		map.addControl(control, position);

		if (controlRef) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			controlRef.current = control;
		}

		return () => {
			if (controlRef) {
				controlRef.current = undefined;
			}
			try {
				map.removeControl(control);
			} catch (err) {
				// TODO investigate later
				// console.error(err);
			}
		};
	}, [map, props]);

	return null;
}

export default MapNativeControl;
