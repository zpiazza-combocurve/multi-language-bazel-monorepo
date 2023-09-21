import pointsWithinPolygon from '@turf/points-within-polygon';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';
import _ from 'lodash';
import mapboxgl from 'mapbox-gl';

import { genericErrorAlert, withAsync } from '@/helpers/alerts';
import { strictlyDifferent } from '@/helpers/arrays';
import { getApi } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import { workerToPromise } from '@/helpers/webWorker';
import { HEATMAP_COLOR_PALETTE, HEATMAP_MIN_WELLS } from '@/map/WellMap/Heatmap/shared';
import { HeaderSettingsMapData, Layer, Shapefile } from '@/map/types';

import {
	CLUSTER_COLOR_HIGH,
	CLUSTER_COLOR_LOW,
	CLUSTER_COLOR_MED,
	WELL_DEFAULT_COLOR,
	getTextColor,
	getTextOutlineColor,
} from './colors';
import { CustomDraw } from './draw/CustomDraw';
import { getPercentileSteps, getSteps } from './heatmap';
import HeatmapWorker from './heatmap.worker?worker';
import {
	ClusterProperties,
	LAYER_TYPES,
	SingleWellProperties,
	dimUnselectedExpression,
	getColorExpression,
	getJoinedClusters,
	hasProperty,
	ifSelectedExpression,
	isSinglePointGeometry,
	isSingleWell,
	toPointFeature,
} from './helpers';
import {
	DEFAULT_WELLS_SIZE,
	MIN_WELLS_CLICKING_SIZE,
	getSizeByHeaderValueExpression,
	getWellRadiusExpression,
} from './well-size';

mapboxgl.setRTLTextPlugin(
	'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
	() => {
		// do nothing
	}
);

const MIN_LONGITUDE = 180;
const MAX_LONGITUDE = -180;
const MIN_LATITUDE = 90;
const MAX_LATITUDE = -90;

const isMapboxSource = (sourceName?: string) =>
	sourceName === 'composite' || sourceName?.startsWith('mapbox://') || sourceName?.startsWith('mapbox-gl-draw-');

const isMapboxLayer = (layer: { type: string; source?: unknown }) =>
	layer.type === 'background' || (typeof layer.source === 'string' && isMapboxSource(layer.source));

const getCenterCoords = (clusterFeature: Feature): [number, number] => {
	const coords =
		clusterFeature.properties?.centerCoords ??
		(clusterFeature.geometry.type === 'Point' ? clusterFeature.geometry.coordinates : [0, 0]);
	return typeof coords === 'string' ? JSON.parse(coords) : coords;
};

function mapper({
	mapboxToken,
	id,
	center,
	zoom,
	theme,
	useSatellite,
	mapHeaderSettings,
	getWellData,
	showWellDialog,
	showDraw,
	getShape,
}) {
	mapboxgl.accessToken = mapboxToken;

	const clustersZoomLimit = 9;

	let map: mapboxgl.Map;
	let draw: CustomDraw | null = null;
	let activeTheme = useSatellite ? 'dark' : theme;
	let currentUseSatellite = useSatellite;
	let layers: Layer[] = [];
	let pendingLayerLoad = false;
	let pendingClustersLoad = false;
	let allWellsClusters: Feature<Point | LineString, SingleWellProperties | ClusterProperties>[] = [];
	let selectedWellsClusters: Feature<Point | LineString, SingleWellProperties | ClusterProperties>[] | undefined =
		undefined;
	let wellDisplay = true;
	let wellsBounds;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const themeDependantProps: Record<string, Record<string, (theme: string) => any>> = {};
	let hoveredLayerId: string | null = null;
	let filteringShapefile: Shapefile | null = null;
	let filterLayerTooltipFields = [];
	let tooltipTimeout: number | null = null;
	let lastMouseCoordinates = null;
	let headerSettings: HeaderSettingsMapData = mapHeaderSettings;

	const mapboxStyles = {
		dark: 'mapbox://styles/mapbox/dark-v10',
		light: 'mapbox://styles/mapbox/light-v10',
		satellite: 'mapbox://styles/mapbox/satellite-streets-v11',
	};
	const heatmapSource = 'heatmap-source';
	const heatmapLayer = 'heatmap-layer';
	const clustersLayer = 'clusters-layer';
	const clustersCountLayer = 'clusters-count-layer';
	const horizontalsLayer = 'lines-layer';
	const clickingHorizontalsLayer = 'clicking-lines-layer';
	const clickingSurfaceLayer = 'clicking-points-layer';
	const lineLabelsLayer = 'line-labels-layer';
	const pointLabelsLayer = 'point-labels-layer';
	const surfaceLayer = 'surface-points-layer';
	const hoverLayer = 'hover-layer';
	const layerTooltip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

	const getMap = () => map;
	const getDraw = () => draw;
	const flyTo = (obj) => map.flyTo(obj);
	const getZoom = () => map.getZoom();
	const getClustersZoomLimit = () => clustersZoomLimit;
	const setCenter = (loc) => map.setCenter(loc);
	const setZoom = (zoomIn) => map.setZoom(zoomIn);
	const addMapListener = (type, callback) => map.on(type, callback);
	const getEventCoords = (e) => e.features[0].geometry.coordinates[0];
	const goToWells = () => {
		if (wellsBounds) {
			map.fitBounds(wellsBounds, { padding: 50 });
		}
	};
	const hasBounds = () => !!wellsBounds;

	const forgetBounds = () => {
		wellsBounds = undefined;
	};

	const setDraws = (features: Feature[]) => {
		if (!draw) {
			return;
		}
		draw.setFeatures({ type: 'FeatureCollection', features });
		map.fire('draw.update');
	};

	const addThemeDependantProp = (layerId, prop, func) => {
		if (!themeDependantProps[layerId]) {
			themeDependantProps[layerId] = { [prop]: func };
		}
		themeDependantProps[layerId][prop] = func;
	};

	const resetThemeDependantProps = () => {
		Object.entries(themeDependantProps).forEach(([layerId, layerProps]) => {
			if (!layerProps) {
				return;
			}
			Object.entries(layerProps).forEach(([prop, func]) => {
				map.setPaintProperty(layerId, prop, func(activeTheme));
			});
		});
	};

	const createDraw = () => {
		if (draw) {
			return;
		}
		draw = new CustomDraw({ theme: activeTheme });
		map.addControl(draw);
		draw.themeProperties.forEach(({ layerId, property, func }) => addThemeDependantProp(layerId, property, func));
	};

	const removeDraw = () => {
		if (!draw) {
			return;
		}
		map.removeControl(draw);
		draw = null;
	};

	const setBounds = (bounds: [number, number, number, number] | null) => {
		wellsBounds = bounds ?? [MIN_LONGITUDE, MIN_LATITUDE, MAX_LONGITUDE, MAX_LATITUDE];
	};

	const setLayerEnabled = (layer: string, enabled: boolean) => {
		if (map.getLayer(layer)) {
			map.setLayoutProperty(layer, 'visibility', enabled ? 'visible' : 'none');
		}
	};

	const setWellsEnabled = (enabled: boolean) => {
		[
			clustersLayer,
			clustersCountLayer,
			horizontalsLayer,
			surfaceLayer,
			lineLabelsLayer,
			pointLabelsLayer,
			clickingHorizontalsLayer,
			clickingSurfaceLayer,
		].forEach((layer) => setLayerEnabled(layer, enabled));

		wellDisplay = enabled;
	};

	const clearTooltipTimeout = () => {
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout);
			tooltipTimeout = null;
		}
	};

	const showLayerTooltip = (content) => {
		if (!lastMouseCoordinates) {
			return;
		}
		layerTooltip.setLngLat(lastMouseCoordinates).setHTML(content).addTo(map);
	};

	const onFilterLayerMove = (e) => {
		lastMouseCoordinates = e.lngLat;
		if (!e.features.length || e.features[0].id === hoveredLayerId) {
			return;
		}

		assert(filteringShapefile, 'Filtering shapefile is null');

		if (hoveredLayerId !== null) {
			map.setFeatureState(
				{
					source: filteringShapefile.idShapefile,
					id: hoveredLayerId,
					sourceLayer: filteringShapefile.name,
				},
				{ hover: false }
			);
		}
		hoveredLayerId = e.features[0].id;
		map.setFeatureState(
			{ source: filteringShapefile.idShapefile, id: hoveredLayerId ?? '', sourceLayer: filteringShapefile.name },
			{ hover: true }
		);

		if (filterLayerTooltipFields?.length) {
			clearTooltipTimeout();
			const content = `<div class="layer-tooltip">${filterLayerTooltipFields
				.map((field) => `<p><strong>${field}:</strong> ${e.features[0]?.properties?.[field]}</p>`)
				.join('')}</div>`;
			tooltipTimeout = window.setTimeout(() => {
				showLayerTooltip(content);
			}, 1000);
		}
	};

	const onFilterLayerLeave = () => {
		if (hoveredLayerId !== null) {
			assert(filteringShapefile, 'Filtering shapefile is null');
			map.setFeatureState(
				{ source: filteringShapefile.idShapefile, id: hoveredLayerId, sourceLayer: filteringShapefile.name },
				{ hover: false }
			);
		}
		hoveredLayerId = null;

		layerTooltip.remove();
		clearTooltipTimeout();
	};

	const getNewFeaturesOnClick = async (filteringShapefileId: string, featureId: number, multiSelection: boolean) => {
		const shapeId = `${filteringShapefileId}[${featureId}]`;

		if (!draw) {
			return { newFeatures: null, added: false };
		}

		const currentFeatures = draw.getAll() as FeatureCollection;

		if (multiSelection) {
			const newFeatures = currentFeatures.features.filter((f) => f.properties?._ccMapShapeId_ !== shapeId);
			if (newFeatures.length < currentFeatures.features.length) {
				return { newFeatures, added: false };
			}
			const shape = await getShape(filteringShapefileId, featureId);
			const shapeWithId = { ...shape, properties: { ...shape.properties, _ccMapShapeId_: shapeId } };
			return { newFeatures: [...newFeatures, shapeWithId], added: true };
		}

		const shape = await getShape(filteringShapefileId, featureId);
		const shapeWithId = { ...shape, properties: { ...shape.properties, _ccMapShapeId_: shapeId } };
		return { newFeatures: [shapeWithId], added: true };
	};

	const onFilterLayerClick = async (e) => {
		assert(filteringShapefile, 'Filtering shapefile is null');
		const featureId = e.features[0]?.id - 1;
		const multiSelection = e.originalEvent.ctrlKey || e.originalEvent.metaKey;

		const { newFeatures, added } = await getNewFeaturesOnClick(filteringShapefile._id, featureId, multiSelection);

		if (!newFeatures || !draw) {
			return;
		}

		const currentFeatures = draw.getAll() as FeatureCollection;
		draw.setFeatures({ ...currentFeatures, features: newFeatures });
		if (added) {
			const allDraws = draw.getAll().features as Array<Feature & { id: string }>;
			draw.resetMode([...draw.getSelectedIds(), allDraws[allDraws.length - 1].id]);
		}
		map.fire('draw.update');
	};

	const removeHoverLayer = () => {
		if (!map.getLayer(hoverLayer)) {
			return;
		}
		map.off('mousemove', hoverLayer, onFilterLayerMove);
		map.off('mouseleave', hoverLayer, onFilterLayerLeave);
		map.off('click', hoverLayer, onFilterLayerClick);
		map.removeLayer(hoverLayer);

		filterLayerTooltipFields = [];

		draw?.setSelectPaused(false);
	};

	const createHoverLayer = ({ idShapefile, name, color, tooltipFields, shapeType }) => {
		if (map.getLayer(hoverLayer)) {
			return;
		}

		draw?.setSelectPaused(true);

		const layerBase = {
			id: hoverLayer,
			source: idShapefile,
			'source-layer': name,
		};
		if (shapeType === 'POLYGON') {
			map.addLayer({
				...layerBase,
				type: 'fill',
				paint: {
					'fill-color': color,
					'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.1, 0],
				},
			});
		} else if (shapeType === 'POLYLINE') {
			map.addLayer({
				...layerBase,
				type: 'line',
				paint: {
					'line-color': color,
					'line-width': 10,
					'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0],
					'line-blur': 9,
				},
				layout: {
					'line-cap': 'round',
				},
			});
		} else if (['POINT', 'MULTIPOINT'].includes(shapeType)) {
			map.addLayer({
				...layerBase,
				type: 'circle',
				paint: {
					'circle-color': color,
					'circle-radius': 10,
					'circle-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0],
					'circle-blur': 0.5,
				},
			});
		}
		map.moveLayer(hoverLayer, idShapefile);
		map.on('mousemove', hoverLayer, onFilterLayerMove);
		map.on('mouseleave', hoverLayer, onFilterLayerLeave);
		map.on('click', hoverLayer, onFilterLayerClick);
		map.on('mouseenter', hoverLayer, () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', hoverLayer, () => {
			map.getCanvas().style.cursor = '';
		});

		filterLayerTooltipFields = tooltipFields;
	};

	const setFilteringShapefile = (shapefile) => {
		if (!shapefile && !filteringShapefile) {
			return;
		}
		if (shapefile && filteringShapefile && shapefile._id === filteringShapefile._id) {
			map.setPaintProperty(hoverLayer, 'fill-color', shapefile.color);
			filterLayerTooltipFields = shapefile.tooltipFields;
			return;
		}

		if (filteringShapefile) {
			removeHoverLayer();
		}
		filteringShapefile = shapefile;
		if (filteringShapefile) {
			createHoverLayer(filteringShapefile);
		}
	};

	const addLayer = (layer) => {
		const { idShapefile, shSourceType, shapeType, name, color, opacity, label } = layer;
		const layerType = LAYER_TYPES[shapeType as keyof typeof LAYER_TYPES];

		if (!map.getLayer(idShapefile)) {
			if (!map.getSource(idShapefile)) {
				map.addSource(idShapefile, {
					type: shSourceType,
					url: `mapbox://${idShapefile}`,
				});
			}

			map.addLayer(
				{
					id: idShapefile,
					type: layerType,
					source: idShapefile,
					'source-layer': name.trim(),
				},
				map.getLayer(clustersLayer) && clustersLayer
			);
		} else {
			map.setLayoutProperty(idShapefile, 'visibility', 'visible');

			if (wellDisplay) {
				map.moveLayer(idShapefile, clustersLayer);
			} else {
				map.moveLayer(idShapefile);
			}
		}
		map.setPaintProperty(idShapefile, `${layerType}-opacity`, opacity / 100);
		map.setPaintProperty(idShapefile, `${layerType}-color`, color);
		if (shapeType === 'POLYGON') {
			map.setPaintProperty(idShapefile, 'line-width', [
				'case',
				['boolean', ['feature-state', 'hover'], false],
				3,
				1,
			]);
		}

		if (!label) {
			getApi(`/shapefiles/${idShapefile}`).then((shapefile) => {
				if (shapefile.label) {
					const labelLayerId = `${idShapefile}_label`;
					if (!map.getLayer(labelLayerId)) {
						map.addLayer(
							{
								id: labelLayerId,
								type: 'symbol',
								source: idShapefile,
								'source-layer': name,
								maxzoom: 22,
								layout: {
									'text-field': ['get', `${shapefile.label}`],
									'text-size': 12,
								},
								paint: {
									'text-color': getTextColor(activeTheme),
								},
							},
							map.getLayer(idShapefile) && idShapefile
						);
					} else {
						map.setLayoutProperty(labelLayerId, 'visibility', 'visible');
						map.setLayoutProperty(labelLayerId, 'text-field', ['get', `${shapefile.label}`]);
						map.setPaintProperty(labelLayerId, 'text-color', getTextColor(activeTheme));
					}
					addThemeDependantProp(labelLayerId, 'text-color', getTextColor);
				}
			});
		}

		const labelLayerId = `${idShapefile}_label`;
		if (label !== 'None') {
			if (!map.getLayer(labelLayerId)) {
				map.addLayer(
					{
						id: labelLayerId,
						type: 'symbol',
						source: idShapefile,
						'source-layer': name,
						maxzoom: 22,
						layout: {
							'text-field': ['get', `${label}`],
							'text-size': 12,
						},
						paint: {
							'text-color': getTextColor(activeTheme),
						},
					},
					map.getLayer(idShapefile) && idShapefile
				);
			} else {
				map.setLayoutProperty(labelLayerId, 'visibility', 'visible');
				map.setLayoutProperty(labelLayerId, 'text-field', ['get', `${label}`]);
				map.setPaintProperty(labelLayerId, 'text-color', getTextColor(activeTheme));
			}
			addThemeDependantProp(labelLayerId, 'text-color', getTextColor);
		} else if (map.getLayer(labelLayerId)) {
			map.setLayoutProperty(labelLayerId, 'visibility', 'none');
		}
	};

	const addPresetLayer = ({ name, urls, shapeType, shSourceType }: Layer) => {
		const layerType = LAYER_TYPES[shapeType];

		urls.forEach((url, index) => {
			const sourceName = `${name}-source-${index}`;
			const layerName = `${name}-layer-${index}`;
			if (!map.getSource(sourceName)) {
				map.addSource(sourceName, {
					type: shSourceType,
					tiles: [url],
				});
			}
			if (!map.getLayer(layerName)) {
				map.addLayer(
					{
						id: layerName,
						type: layerType,
						source: sourceName,
					},
					map.getLayer(clustersLayer) && clustersLayer
				);
			} else {
				map.setLayoutProperty(layerName, 'visibility', 'visible');
			}
		});
	};

	const removeLayer = (layer) => {
		const { idShapefile } = layer;
		if (map.getLayer(idShapefile)) {
			map.setLayoutProperty(idShapefile, 'visibility', 'none');
			if (map.getLayer(`${idShapefile}_label`)) {
				map.setLayoutProperty(`${idShapefile}_label`, 'visibility', 'none');
			}
		}
	};

	const removePresetLayer = ({ name, urls }) => {
		urls.forEach((_, index) => {
			const layerName = `${name}-layer-${index}`;
			if (map.getLayer(layerName)) {
				map.setLayoutProperty(layerName, 'visibility', 'none');
			}
		});
	};

	const loadLayers = (layersToShow) => {
		layers = layersToShow;

		if (!map.isStyleLoaded()) {
			pendingLayerLoad = true;
			return;
		}
		pendingLayerLoad = false;

		for (let i = 0; i < layers.length; i++) {
			const layer = layers[i];
			if (layer.active) {
				if (layer.preset) {
					addPresetLayer(layer);
				} else {
					addLayer(layer);
				}
			} else if (layer.preset) {
				removePresetLayer(layer);
			} else {
				removeLayer(layer);
			}
		}

		setFilteringShapefile(layers.find((layer) => layer.filtering));
	};

	const getMapBounds = () => {
		const [[west, south], [east, north]] = map.getBounds().toArray();
		return [west, south, east, north];
	};

	const getMapBoundsCoords = () => {
		const [[west, south], [east, north]] = map.getBounds().toArray();
		return [
			[west, south],
			[east, south],
			[east, north],
			[west, north],
			[west, south],
		];
	};

	const getTooltipHtml = (wellId, displayData) =>
		`<div class="map-well-info">
			${displayData.map(({ label, value }) => `<span><strong>${label}: </strong>${value}</span>`).join('')}
			<button id="map-well-popup-button-${wellId}" type="button" class="view-well-btn md-btn md-btn--flat md-btn--text md-inline-block primary-bot-border on-hover-paper-1">
				View Well
			</button>
		</div>`;

	const showTooltip = async (e) => {
		try {
			const feature = _.minBy<Feature<Point | LineString>>(
				e.features,
				({ properties }) =>
					properties?.[headerSettings?.sizeBy?.header ?? ''] ?? headerSettings?.sizeBy?.min ?? 0
			);
			const wellId = feature?.properties?.wellId;
			if (!wellId) {
				return;
			}

			const coordinates =
				feature.geometry.type === 'Point' ? feature.geometry.coordinates : feature.geometry.coordinates[0];

			const wellData = await withAsync(getWellData(wellId));

			while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
				coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
			}

			const popup = new mapboxgl.Popup()
				.setLngLat(coordinates as [number, number])
				.setHTML(getTooltipHtml(wellId, wellData))
				.addTo(map);
			popup
				.getElement()
				.querySelector(`#map-well-popup-button-${wellId}`)
				?.addEventListener('click', () => showWellDialog(wellId));
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const addHeatmap = async ({ header, gridType, gridCellSize, colorScale }) => {
		if (!allWellsClusters.every(isSingleWell)) {
			return { error: 'Please zoom in to see wells. Heatmap does not work at well cluster mode' };
		}

		const wellPoints = {
			type: 'FeatureCollection' as const,
			features: allWellsClusters.map(toPointFeature),
		};
		const boundsPolygon = {
			type: 'Feature' as const,
			properties: {},
			geometry: { type: 'Polygon' as const, coordinates: [getMapBoundsCoords()] },
		};
		const visibleWells = pointsWithinPolygon(wellPoints, boundsPolygon);

		const pointFeatures = {
			type: 'FeatureCollection',
			features: visibleWells.features.filter((f) => hasProperty(f, header)).map(toPointFeature),
		};

		if (pointFeatures.features.length < HEATMAP_MIN_WELLS) {
			return {
				error:
					'Not enough wells on map with value for the selected header. ' +
					`At least ${HEATMAP_MIN_WELLS} required for heatmap.`,
			};
		}

		const generateHeatmapAsync = workerToPromise<FeatureCollection>(new HeatmapWorker());
		const heatmapData = await generateHeatmapAsync({
			gridType,
			pointFeatures,
			options: {
				property: header,
				cellSize: gridCellSize,
			},
		});

		const getStepsFn = colorScale === 'percentile' ? getPercentileSteps : getSteps;
		const steps = getStepsFn(pointFeatures, HEATMAP_COLOR_PALETTE.length, { property: header });
		const getColorExpression = (property) =>
			steps.length
				? ([
						'interpolate',
						['linear'],
						['get', property],
						...strictlyDifferent(steps.map(({ value }) => value)).reduce(
							(prev, value, i) => [...prev, value, HEATMAP_COLOR_PALETTE[i]],
							[] as Array<string | number>
						),
				  ] as ['interpolate', ...unknown[]])
				: 'rgba(0,0,0,0)';

		const src = map.getSource(heatmapSource);
		if (src?.type === 'geojson') {
			src.setData(heatmapData);

			map.setPaintProperty(heatmapLayer, 'fill-color', getColorExpression(header));
			map.setLayoutProperty(heatmapLayer, 'visibility', 'visible');
		} else {
			map.addSource(heatmapSource, {
				type: 'geojson',
				data: heatmapData,
				tolerance: 0.1, // prevents small squares from disappearing at high zoom levels
			});

			map.addLayer({
				id: heatmapLayer,
				type: 'fill',
				source: heatmapSource,
				paint: {
					'fill-color': getColorExpression(header),
					'fill-outline-color': 'rgba(0,0,0,0)',
					'fill-opacity': 0.5,
				},
			});

			map.moveLayer(heatmapLayer);
		}

		return { legend: steps.reduce((prev, { label }, i) => ({ ...prev, [HEATMAP_COLOR_PALETTE[i]]: label }), {}) };
	};

	const hideHeatmap = () => {
		if (map.getLayer(heatmapLayer)) {
			map.setLayoutProperty(heatmapLayer, 'visibility', 'none');
		}
	};

	const styleWells = (newHeaderSettings: HeaderSettingsMapData) => {
		headerSettings = newHeaderSettings;
		const headerColors = headerSettings.headerColors;

		if (map.getLayer(surfaceLayer)) {
			map.setPaintProperty(surfaceLayer, 'circle-color', getColorExpression(headerColors, activeTheme));
			map.setPaintProperty(horizontalsLayer, 'line-color', getColorExpression(headerColors, activeTheme));
			addThemeDependantProp(surfaceLayer, 'circle-color', (theme) => {
				return getColorExpression(headerColors, theme);
			});
			addThemeDependantProp(horizontalsLayer, 'line-color', (theme) => {
				return getColorExpression(headerColors, theme);
			});

			const wellsSize = getWellRadiusExpression(headerSettings.sizeBy);
			map.setPaintProperty(surfaceLayer, 'circle-radius', wellsSize);
			map.setPaintProperty(clickingSurfaceLayer, 'circle-radius', ['max', wellsSize, MIN_WELLS_CLICKING_SIZE]);
			const wellsSortKey = ['-', getSizeByHeaderValueExpression(headerSettings.sizeBy)];
			map.setLayoutProperty(surfaceLayer, 'circle-sort-key', wellsSortKey);
		}
	};

	const setClusters = (allWellsClustersToShow, selectedWellsClustersToShow?) => {
		allWellsClusters = allWellsClustersToShow;
		selectedWellsClusters = selectedWellsClustersToShow;

		if (!map.isStyleLoaded()) {
			pendingClustersLoad = true;
			return;
		}
		pendingClustersLoad = false;

		const joinedClusters = getJoinedClusters(allWellsClustersToShow, selectedWellsClustersToShow);

		const getClustersData = () => ({
			type: 'FeatureCollection' as const,
			features: joinedClusters,
		});
		const getPointData = () => ({
			type: 'FeatureCollection' as const,
			features: joinedClusters.filter(isSingleWell).map(toPointFeature),
		});

		const getOnlySurfaceData = () => ({
			type: 'FeatureCollection' as const,
			features: joinedClusters.filter(isSinglePointGeometry).map(toPointFeature),
		});

		const src = map.getSource('clusters-source');
		// source exists, therefore layers exist too
		if (src?.type === 'geojson') {
			// update sources data
			src.setData(getClustersData());
			const surfaceSource = map.getSource('surface-source');
			if (surfaceSource.type === 'geojson') {
				surfaceSource.setData(getPointData());
			}
			const onlySurfaceSource = map.getSource('only-surface-source');
			if (onlySurfaceSource.type === 'geojson') {
				onlySurfaceSource.setData(getOnlySurfaceData());
			}
		} else {
			// add sources
			map.addSource('clusters-source', {
				type: 'geojson',
				data: getClustersData(),
			});
			map.addSource('surface-source', {
				type: 'geojson',
				data: getPointData(),
			});
			map.addSource('only-surface-source', {
				type: 'geojson',
				data: getOnlySurfaceData(),
			});

			// add layers
			map.addLayer({
				id: clustersLayer,
				type: 'circle',
				source: 'clusters-source',
				filter: ['>', ['get', 'point_count'], 1],
				paint: {
					'circle-color': [
						'step',
						['get', 'point_count'],
						CLUSTER_COLOR_LOW,
						100,
						CLUSTER_COLOR_MED,
						750,
						CLUSTER_COLOR_HIGH,
					],
					'circle-radius': ['step', ['get', 'point_count'], 15, 100, 20, 750, 25],
					'circle-opacity': 0.8,
				},
			});
			map.addLayer({
				id: 'clusters-count-layer',
				type: 'symbol',
				source: 'clusters-source',
				filter: ['>', ['get', 'point_count'], 1],
				layout: {
					'text-field': '{label}',
					'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
					'text-size': 12,
				},
			});

			map.addLayer({
				id: horizontalsLayer,
				type: 'line',
				source: 'clusters-source',
				paint: {
					'line-color': dimUnselectedExpression(WELL_DEFAULT_COLOR, activeTheme),
					'line-width': 2,
					'line-opacity': 0.8,
				},
			});
			addThemeDependantProp(horizontalsLayer, 'line-color', (theme) =>
				dimUnselectedExpression(WELL_DEFAULT_COLOR, theme)
			);

			map.addLayer({
				id: surfaceLayer,
				type: 'circle',
				source: 'surface-source',
				paint: {
					'circle-color': dimUnselectedExpression(WELL_DEFAULT_COLOR, activeTheme),
					'circle-radius': DEFAULT_WELLS_SIZE,
					'circle-opacity': 0.8,
					'circle-stroke-width': 1,
					'circle-stroke-color': getTextColor(activeTheme),
					'circle-stroke-opacity': ifSelectedExpression(0.8, 0),
				},
			});
			addThemeDependantProp(surfaceLayer, 'circle-color', (theme) =>
				dimUnselectedExpression(WELL_DEFAULT_COLOR, theme)
			);
			addThemeDependantProp(surfaceLayer, 'circle-stroke-color', getTextColor);

			map.addLayer({
				id: clickingHorizontalsLayer,
				type: 'line',
				source: 'clusters-source',
				paint: {
					'line-width': 12,
					'line-opacity': 0,
				},
			});

			map.addLayer({
				id: clickingSurfaceLayer,
				type: 'circle',
				source: 'surface-source',
				paint: {
					'circle-radius': Math.max(DEFAULT_WELLS_SIZE, MIN_WELLS_CLICKING_SIZE),
					'circle-opacity': 0,
				},
			});

			const labelPaint = {
				'text-color': getTextColor(activeTheme),
				'text-halo-width': 1,
				'text-halo-color': getTextOutlineColor(activeTheme),
				'text-halo-blur': 1,
				'text-opacity': ifSelectedExpression(0.9, 0.25),
			};

			map.addLayer({
				id: lineLabelsLayer,
				type: 'symbol',
				source: 'clusters-source',
				filter: ['==', ['geometry-type'], 'LineString'],
				layout: {
					'symbol-placement': 'line',
					'text-field': '{wellLabel}',
					'text-size': 12,
					'text-padding': 0,
				},
				paint: labelPaint,
			});
			addThemeDependantProp(lineLabelsLayer, 'text-color', getTextColor);
			addThemeDependantProp(lineLabelsLayer, 'text-halo-color', getTextOutlineColor);

			map.addLayer({
				id: pointLabelsLayer,
				type: 'symbol',
				source: 'only-surface-source',
				layout: {
					'symbol-placement': 'point',
					'text-field': '{wellLabel}',
					'text-size': 12,
					'text-padding': 5,
					'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
					'text-justify': 'auto',
					'text-radial-offset': 1,
				},
				paint: labelPaint,
			});
			addThemeDependantProp(pointLabelsLayer, 'text-color', getTextColor);
			addThemeDependantProp(pointLabelsLayer, 'text-halo-color', getTextOutlineColor);

			// add events
			map.on('click', clustersLayer, (e) => {
				const features = map.queryRenderedFeatures(e.point, { layers: [clustersLayer] });
				map.flyTo({
					center: getCenterCoords(features[0]),
					zoom: map.getZoom() + 2,
				});
			});
			map.on('click', clickingSurfaceLayer, showTooltip);
			map.on('click', clickingHorizontalsLayer, showTooltip);

			map.on('mouseenter', clustersLayer, () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', clustersLayer, () => {
				map.getCanvas().style.cursor = '';
			});
			map.on('mouseenter', clickingHorizontalsLayer, () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', clickingHorizontalsLayer, () => {
				map.getCanvas().style.cursor = '';
			});
			map.on('mouseover', clickingSurfaceLayer, () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', clickingSurfaceLayer, () => {
				map.getCanvas().style.cursor = '';
			});
		}

		map.once('idle', () => styleWells(headerSettings));

		// add draw
		if (showDraw) {
			createDraw();
		}
	};

	const getTheme = () => ({ theme: activeTheme, useSatellite });

	const changeTheme = (newTheme: 'light' | 'dark', newUseSatellite: boolean) => {
		const currentBaseStyle = currentUseSatellite ? 'satellite' : activeTheme;
		const newBaseStyle = newUseSatellite ? 'satellite' : newTheme;
		if (newBaseStyle === currentBaseStyle) {
			return;
		}

		const currentStyle = map.getStyle();
		map.once('style.load', () => {
			if (currentStyle.sources) {
				Object.entries(currentStyle.sources)
					.filter(([name]) => !isMapboxSource(name))
					.forEach(([name, source]) => {
						if (!map.getSource(name)) {
							map.addSource(name, source);
						}
					});

				if (currentStyle.layers) {
					currentStyle.layers
						.filter((layer) => !isMapboxLayer(layer))
						.forEach((layer) => {
							if (!map.getLayer(layer.id)) {
								map.addLayer(layer);
							}
						});
				}
			}

			resetThemeDependantProps();
		});

		map.setStyle(mapboxStyles[newBaseStyle]);
		currentUseSatellite = newUseSatellite;
		activeTheme = newUseSatellite ? 'dark' : newTheme;
	};

	const initMap = () => {
		map = new mapboxgl.Map({
			zoom,
			minZoom: 4,
			maxZoom: 19,
			container: id,
			trackResize: true,
			center,
			style: mapboxStyles[currentUseSatellite ? 'satellite' : activeTheme],
		});

		map.on('load', () => {
			loadLayers(layers);
			if (wellDisplay) {
				setClusters(allWellsClusters, selectedWellsClusters);
			}

			if (showDraw) {
				createDraw();
			}
		});

		map.on('idle', () => {
			if (pendingLayerLoad) {
				loadLayers(layers);
			}
			if (pendingClustersLoad) {
				setClusters(allWellsClusters, selectedWellsClusters);
			}
		});

		map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }));
		map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }));

		map.scrollZoom.disable();

		addMapListener('wheel', (e) => {
			const { deltaY } = e.originalEvent;
			if (deltaY < 0) {
				flyTo({ zoom: Math.ceil(getZoom() + 1) });
			}
			if (deltaY > 0) {
				flyTo({ zoom: Math.floor(getZoom() - 1) });
			}
		});
		addMapListener('mouseover', () => {
			if (window.addEventListener) {
				// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
				window.addEventListener('DOMMouseScroll', () => {}, false);
			}
			// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
			window.onwheel = () => {};
		});
		addMapListener('mouseout', () => {
			if (window.removeEventListener) {
				// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
				window.removeEventListener('DOMMouseScroll', () => {}, false);
			}
			window.onwheel = null;
		});
	};

	function retMapper() {
		initMap();
		return {
			flyTo,
			getMap,
			getDraw,
			getZoom,
			setZoom,
			getClustersZoomLimit,
			addHeatmap,
			hideHeatmap,
			setClusters,
			setCenter,
			getTheme,
			changeTheme,
			getMapBounds,
			addMapListener,
			getEventCoords,
			getMapBoundsCoords,
			addLayer,
			removeLayer,
			loadLayers,
			setWellsEnabled,
			styleWells,
			setDraws,
			createDraw,
			removeDraw,
			goToWells,
			setBounds,
			hasBounds,
			forgetBounds,
		};
	}

	return retMapper();
}

export type Mapper = ReturnType<typeof mapper>;

export default mapper;
