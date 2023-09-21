import { Polygon } from 'geojson';
import { Map, ScaleControl } from 'mapbox-gl';

import {
	MAP_IMAGE_HEIGHT,
	MAP_IMAGE_WIDTH,
	MAX_SCALE_LENGTH,
	MINIMAP_CLIENT_HEIGHT,
	MINIMAP_CLIENT_WIDTH,
	ScaleData,
} from './utils';

interface MapExportData {
	imgData: string;
	bearing: number;
	scale: ScaleData;
	boundsPolygon: Polygon;
}

export const renderMapToImage = (map: Map, horizontalResolution = MAP_IMAGE_WIDTH) => {
	const canvas = map.getCanvas();

	const actualPixelRatioDescriptor = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
	Object.defineProperty(window, 'devicePixelRatio', {
		get() {
			return horizontalResolution / canvas.width;
		},
	});

	const containerWidth = canvas.width;
	const containerHeight = (containerWidth * MAP_IMAGE_HEIGHT) / MAP_IMAGE_WIDTH;

	const topContainer = document.createElement('div');
	topContainer.style.position = 'fixed';
	topContainer.style.width = '0';
	topContainer.style.height = '0';
	topContainer.style.overflow = 'hidden';
	document.body.appendChild(topContainer);
	const container = document.createElement('div');
	container.style.width = `${containerWidth}px`;
	container.style.height = `${containerHeight}px`;
	topContainer.appendChild(container);

	const bearing = map.getBearing();

	const renderMap = new Map({
		container,
		center: map.getCenter(),
		zoom: map.getZoom(),
		style: map.getStyle(),
		bearing,
		pitch: map.getPitch(),
		interactive: false,
		preserveDrawingBuffer: true,
		fadeDuration: 0,
		attributionControl: false,
	});

	const scaleControl = new ScaleControl({
		unit: 'imperial',
		maxWidth: (MAX_SCALE_LENGTH * containerWidth) / MAP_IMAGE_WIDTH,
	});
	renderMap.addControl(scaleControl);

	return new Promise<MapExportData>((resolve) => {
		renderMap.once('idle', () => {
			const imgData = renderMap.getCanvas().toDataURL('image/jpeg');

			// @ts-expect-error hack to get the scale
			const scaleContainer = scaleControl._container;
			const scaleText = scaleContainer.innerText;
			const { width: scaleClientWidth } = scaleContainer.getBoundingClientRect();
			const scaleRatio = MAP_IMAGE_WIDTH / containerWidth;
			const scaleLength = scaleClientWidth * scaleRatio;

			const upperLeftCorner = renderMap.unproject([0, 0]).toArray();
			const upperRightCorner = renderMap.unproject([containerWidth, 0]).toArray();
			const lowerRightCorner = renderMap.unproject([containerWidth, containerHeight]).toArray();
			const lowerLeftCorner = renderMap.unproject([0, containerHeight]).toArray();
			const boundsPolygon = {
				type: 'Polygon' as const,
				coordinates: [[upperLeftCorner, upperRightCorner, lowerRightCorner, lowerLeftCorner, upperLeftCorner]],
			};

			resolve({
				imgData,
				bearing,
				scale: { length: scaleLength, text: scaleText, ratio: scaleRatio },
				boundsPolygon,
			});

			renderMap.remove();
			topContainer.parentNode?.removeChild(topContainer);
			if (actualPixelRatioDescriptor) {
				Object.defineProperty(window, 'devicePixelRatio', actualPixelRatioDescriptor);
			}
		});
	});
};

export const renderMiniMapToImage = (map: Map, boundsPolygon: Polygon, horizontalResolution = MAP_IMAGE_WIDTH) => {
	const canvas = map.getCanvas();
	const zoomRatio = canvas.width / MINIMAP_CLIENT_WIDTH;
	const effectiveZoom = map.getZoom() - Math.log2(zoomRatio);

	if (effectiveZoom <= 0) {
		return Promise.resolve(null);
	}

	const actualPixelRatioDescriptor = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
	Object.defineProperty(window, 'devicePixelRatio', {
		get() {
			return horizontalResolution / MINIMAP_CLIENT_WIDTH;
		},
	});

	const topContainer = document.createElement('div');
	topContainer.style.position = 'fixed';
	topContainer.style.width = '0';
	topContainer.style.height = '0';
	topContainer.style.overflow = 'hidden';
	document.body.appendChild(topContainer);
	const container = document.createElement('div');
	container.style.width = `${MINIMAP_CLIENT_WIDTH}px`;
	container.style.height = `${MINIMAP_CLIENT_HEIGHT}px`;
	topContainer.appendChild(container);

	const renderMap = new Map({
		container,
		center: map.getCenter(),
		zoom: Math.max(0, effectiveZoom - Math.log2(5)),
		style: map.getStyle().sprite,
		interactive: false,
		preserveDrawingBuffer: true,
		fadeDuration: 0,
		attributionControl: false,
	});

	return new Promise<string>((resolve) => {
		renderMap.once('idle', () => {
			renderMap.addLayer({
				type: 'line',
				id: 'main-map-bounds',
				source: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: boundsPolygon } },
				paint: { 'line-color': '#FD9559' },
			});

			renderMap.once('idle', () => {
				const imgData = renderMap.getCanvas().toDataURL('image/jpeg');

				resolve(imgData);

				renderMap.remove();
				topContainer.parentNode?.removeChild(topContainer);
				if (actualPixelRatioDescriptor) {
					Object.defineProperty(window, 'devicePixelRatio', actualPixelRatioDescriptor);
				}
			});
		});
	});
};
