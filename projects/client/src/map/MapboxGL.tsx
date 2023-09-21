// https://github.com/mapbox/mapbox-gl-js
// https://github.com/mapbox/mapbox-gl-draw
// https://docs.mapbox.com/mapbox-gl-js/
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import { createTheme, useTheme } from '@material-ui/core';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import styled from 'styled-components';

import { useGetter } from '@/components/hooks';
import { counter } from '@/helpers/Counter';
import { useAlfa } from '@/helpers/alfa';
import { ThemeProvider, getTheme } from '@/helpers/theme';

import { MapboxGLContext } from './MapboxGL/context';
import { useMapboxToken } from './hooks';

const DEFAULT_LAT = 48.12070191689921;
const DEFAULT_LON = -102.46419114173229;
const DEFAULT_ZOOM = 5;
const MIN_ZOOM = 4.1;
const MAX_ZOOM = 19;

const DEFAULT_CENTER: [number, number] = [DEFAULT_LON, DEFAULT_LAT];

const THEMES = {
	dark: 'mapbox://styles/mapbox/dark-v10',
	light: 'mapbox://styles/mapbox/light-v10',
	satellite: 'mapbox://styles/mapbox/satellite-streets-v11',
};

interface MapboxGLProps {
	center?: mapboxgl.LngLatLike;
	className?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
	satelliteView?: boolean;
	onMapReady?: (map: mapboxgl.Map) => void;
	onMapOff?: (map: mapboxgl.Map) => void;
}

export function WellMapTheme({ children }) {
	const theme = useTheme();
	const lightTheme = useMemo(() => {
		const inptLightTheme = createTheme(getTheme('light', { background: undefined, backgroundOpaque: undefined }));
		const muiLightTheme = createTheme({ ...theme, palette: { type: 'light' } });
		return {
			...inptLightTheme,
			// use mui default light background because there is no easy way to get inpt light background without changing the theme
			palette: { ...inptLightTheme.palette, background: muiLightTheme.palette.background },
		};
	}, [theme]);

	return <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>;
}

export const MapContainer = styled.div`
	color: ${({ theme }) => theme.palette.text.primary}; // HACK for map mui theme
	.mapboxgl-ctrl-group button {
		background-color: ${({ theme }) => theme.palette.background.default}; // HACK for map mui theme
		color: ${({ theme }) => theme.palette.text.primary}; // HACK for map mui theme
	}
`;

/**
 * React component for mapboxgl integration
 *
 * @note need to specify some sort of height and width otherwise expect weird behaviors. Flex meassures work
 */
function MapboxGL(
	{ center = DEFAULT_CENTER, children, className, style, satelliteView, onMapReady, onMapOff }: MapboxGLProps,
	ref: React.ForwardedRef<mapboxgl.Map | undefined>
) {
	const { theme } = useAlfa();
	const containerRef = useRef<HTMLDivElement>(null);
	const [map, setMap] = useState<mapboxgl.Map | undefined>(undefined);

	const getBounds = useGetter(map?.getBounds());

	const mapboxToken = useMapboxToken();

	useImperativeHandle(ref, () => map);

	const getCenter = useGetter(center);

	const isMountedRef = useRef(false);

	const [hasLoaded, setHasLoaded] = useState(false);

	useEffect(() => {
		if (!mapboxToken) {
			return;
		}

		if (!containerRef.current) {
			throw new Error('Expected map container to exist');
		}

		setHasLoaded(false);

		mapboxgl.accessToken = mapboxToken;

		const map_ = new mapboxgl.Map({
			zoom: DEFAULT_ZOOM,
			minZoom: MIN_ZOOM,
			maxZoom: MAX_ZOOM,
			style: satelliteView ? THEMES.satellite : THEMES[theme],
			trackResize: true,
			container: containerRef.current,
			center: getCenter(),
			dragRotate: false,
			bounds: getBounds(),
		});

		setMap(map_);

		const handler = () => {
			setHasLoaded(true);
			isMountedRef.current = true;
		};

		map_.on('load', handler);

		return () => {
			map_.off('load', handler);
			if (onMapOff) {
				onMapOff(map_);
			}
			// run only after all handlers have been removed
			setTimeout(() => {
				map_.remove();
				isMountedRef.current = false;
			});
		};
	}, [theme, getCenter, mapboxToken, satelliteView, getBounds, onMapOff]);

	const handleOnResize = useCallback(() => {
		if (!map) {
			return;
		}
		map.resize();
	}, [map]);

	useEffect(() => {
		if (map && onMapReady && hasLoaded) {
			onMapReady(map);
		}
	}, [hasLoaded, onMapReady, map]);

	return (
		<WellMapTheme>
			<MapContainer ref={containerRef} style={style} className={className}>
				{/* eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later */}
				<AutoSizer onResize={handleOnResize}>{() => <></>}</AutoSizer>
			</MapContainer>
			<MapboxGLContext.Provider
				// eslint-disable-next-line react-hooks/exhaustive-deps
				key={useMemo(() => counter.nextId(), [map])}
				value={useMemo(() => ({ map, isMountedRef }), [map])}
			>
				{hasLoaded && children}
			</MapboxGLContext.Provider>
		</WellMapTheme>
	);
}

export default React.forwardRef(MapboxGL);
