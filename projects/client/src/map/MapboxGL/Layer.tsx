import { isEqual, omit } from 'lodash-es';
import mapboxgl from 'mapbox-gl';
import { useContext } from 'react';

import { useCallbackRef, useLifecycle } from '@/components/hooks';
import { useId } from '@/components/hooks/useId';

import { SourceContext } from './Source';
import { MapboxGLContext } from './context';

type LayerProps = Omit<mapboxgl.Layer, 'id' | 'source'> &
	Partial<
		Record<'onClick' | 'onMouseEnter' | 'onMouseLeave' | 'onMouseMove', (ev: mapboxgl.MapLayerMouseEvent) => void>
	> & {
		id?: string;
		beforeLayer?: string;
	};

/**
 * React + Mapbox Layer integration
 *
 * @example
 * 	<MapboxGL>
 * 		<Source type='geojson' data={wellData}>
 * 			<Layer
 * 				id='target-well'
 * 				type='fill'
 * 				paint={{
 * 					'fill-opacity': 0.2,
 * 					'fill-outline-color': 'yellow',
 * 				}}
 * 			/>
 * 		</Source>
 * 	</MapboxGL>;
 *
 * @see https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/
 * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addlayer
 */
function Layer(props: LayerProps) {
	const { beforeLayer } = props;
	const fakeId = useId();
	const {
		id: source,
		addLayer: addLayerToSource,
		removeLayer: removeLayerFromSource,
	} = useContext(SourceContext) ?? {};
	const { map, isMountedRef } = useContext(MapboxGLContext);

	const id = props.id ?? fakeId;
	const onClick = useCallbackRef(props.onClick);
	const onMouseEnter = useCallbackRef(props.onMouseEnter);
	const onMouseLeave = useCallbackRef(props.onMouseLeave);
	const onMouseMove = useCallbackRef(props.onMouseMove);

	const layerData = omit(props, 'onClick', 'onMouseEnter', 'onMouseLeave', 'children');

	function createLayer() {
		if (!map || !source || !addLayerToSource) {
			return;
		}

		addLayerToSource(id);

		if (beforeLayer) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			map.addLayer({ id, source, ...layerData } as any, beforeLayer);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			map.addLayer({ id, source, ...layerData } as any);
		}
		// TODO only add events when necessary
		map.on('click', id, onClick);
		map.on('mouseenter', id, onMouseEnter);
		map.on('mousemove', id, onMouseMove);
		map.on('mouseleave', id, onMouseLeave);
	}
	function removeLayer() {
		if (!map || !isMountedRef?.current || !map.getLayer(id) || !removeLayerFromSource) {
			return;
		}
		removeLayerFromSource(id);
		map.off('click', id, onClick);
		map.off('mouseenter', id, onMouseEnter);
		map.off('mousemove', id, onMouseMove);
		map.off('mouseleave', id, onMouseLeave);
		map.removeLayer(id);
	}

	useLifecycle(
		{
			onDidMount() {
				createLayer();
			},
			onWillUnmount() {
				removeLayer();
			},
			onDidUpdate(prevLayerData) {
				if (!isEqual(prevLayerData, layerData)) {
					removeLayer();
					createLayer();
				}
			},
		},
		layerData
	);

	return null;
}

export default Layer;
