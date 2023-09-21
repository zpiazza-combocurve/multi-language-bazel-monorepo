// https://docs.mapbox.com/mapbox-gl-js/api/sources/
import { omit } from 'lodash-es';
import mapboxgl from 'mapbox-gl';
import { createContext, useContext, useRef, useState } from 'react';
import * as React from 'react';

import { useLifecycle } from '@/components/hooks';
import { useId } from '@/components/hooks/useId';

import { MapboxGLContext } from './context';

export const SourceContext = createContext<
	{ id: string; addLayer(layerId: string): void; removeLayer(layerId: string): void } | undefined
>(undefined);

// TODO use class components for better control of life cycles
function Source({ children, ...props }: mapboxgl.AnySourceData & { children: React.ReactNode }) {
	const { map, isMountedRef } = useContext(MapboxGLContext);
	const id = useId();

	const [rendered, setRendered] = useState(false);

	const layersRef = useRef(new Set<string>());

	function addLayer(layerId: string) {
		layersRef.current.add(layerId);
	}

	function removeLayer(layerId: string) {
		layersRef.current.delete(layerId);
	}

	function removeAllLayers() {
		if (!map?.loaded) {
			return;
		}

		layersRef.current.forEach((layerId) => {
			if (map.getLayer(layerId)) {
				map.removeLayer(layerId);
			}
		});
	}

	useLifecycle(
		{
			onDidMount() {
				if (!map) {
					return;
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				map.addSource(id, omit(props, 'children'));
				setRendered(true);
			},
			onWillUnmount() {
				if (!map || !isMountedRef?.current) {
					return;
				}
				removeAllLayers();
				map.removeSource(id);
			},
			onDidUpdate(prevProps) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				if (!map || (!props.url && !props.data)) {
					return;
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				if (props.data !== prevProps.data) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					(map.getSource(id) as mapboxgl.GeoJSONSource)?.setData(props.data);
				}
			},
		},
		props
	);

	return (
		// eslint-disable-next-line react/jsx-no-constructed-context-values -- TODO eslint fix later
		<SourceContext.Provider value={{ id, addLayer, removeLayer }}>{rendered && children}</SourceContext.Provider>
	);
}

export default Source;
