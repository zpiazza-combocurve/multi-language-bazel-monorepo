import { Feature, FeatureCollection } from 'geojson';
import mapboxgl from 'mapbox-gl';
import { useContext, useRef } from 'react';

import { withLoadingBar } from '@/helpers/alerts';
import { getApi } from '@/helpers/routing';

import Layer from '../MapboxGL/Layer';
import { MapboxGLContext } from '../MapboxGL/context';

const hoverLayer = 'hover-layer';
export const useFilterLayer = (shapefile, drawRef) => {
	const { map } = useContext(MapboxGLContext);
	const getShape = (shapefileId, index) => withLoadingBar(getApi(`/shapefiles/${shapefileId}/shapes/${index}`));
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const selectedLayersStore = useRef<any>([]);
	const hoveredStateId = useRef<string | undefined>(undefined);
	const sourceId = useRef<string>('');
	const layerTooltip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
	let lastMouseCoordinates = null;

	let filterLayerTooltipFields = [];
	let tooltipTimeout: number | null = null;

	const clearTooltipTimeout = () => {
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout);
			tooltipTimeout = null;
		}
	};

	const showLayerTooltip = (content) => {
		if (!lastMouseCoordinates || !map) {
			return;
		}
		layerTooltip.setLngLat(lastMouseCoordinates).setHTML(content).addTo(map);
	};
	const getNewFeaturesOnClick = async (filteringShapefileId: string, featureId: number, multiSelection: boolean) => {
		const shapeId = `${filteringShapefileId}[${featureId}]`;

		if (!drawRef?.current) {
			return { newFeatures: null, added: false };
		}

		const currentFeatures = drawRef?.current.getAll() as FeatureCollection;

		if (multiSelection) {
			const newFeatures = currentFeatures.features.filter((f) => f.properties?._ccMapShapeId_ !== shapeId);
			if (newFeatures.length < currentFeatures.features.length) {
				return { newFeatures, added: false };
			}
			const shape = await getShape(filteringShapefileId, featureId);
			const shapeWithId = { ...shape, properties: { ...shape.properties, _ccMapShapeId_: shapeId } };
			selectedLayersStore.current.push(shapeWithId);
			return { newFeatures: [...newFeatures, shapeWithId], added: true };
		}

		const shape = await getShape(filteringShapefileId, featureId);
		const shapeWithId = { ...shape, properties: { ...shape.properties, _ccMapShapeId_: shapeId } };
		selectedLayersStore.current = [shapeWithId];
		return { newFeatures: [shapeWithId], added: true };
	};

	const onFilterLayerClick = async (e) => {
		if (!map) return;
		const featureId = e.features[0]?.id - 1;
		const multiSelection = e.originalEvent.ctrlKey || e.originalEvent.metaKey;

		const { newFeatures, added } = await getNewFeaturesOnClick(shapefile._id, featureId, multiSelection);
		if (!newFeatures || !drawRef?.current) {
			return;
		}

		const currentFeatures = drawRef?.current.getAll() as FeatureCollection;
		drawRef?.current.setFeatures({ ...currentFeatures, features: newFeatures });
		if (added) {
			const allDraws = drawRef?.current.getAll().features as Array<Feature & { id: string }>;
			// hacky way to resolve an issue where layers would be deselected when doing multiselection
			const selectedLayers = selectedLayersStore.current
				.map((draw) => draw?.properties?._ccMapShapeId_)
				.map((id) => allDraws.find((draw) => id === draw?.properties?._ccMapShapeId_))
				.map((draw) => draw.id);
			drawRef?.current.resetMode([...selectedLayers]);
		}
		map.fire('draw.update');
	};

	const onFilterLayerMove = (e, name) => {
		lastMouseCoordinates = e.lngLat;
		if ((e?.features || []).length > 0 && map) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			sourceId.current = e.features![0].source;
			if (hoveredStateId !== undefined) {
				map.setFeatureState(
					{ source: sourceId.current, id: hoveredStateId.current, sourceLayer: name },
					{ hover: false }
				);
			}
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			hoveredStateId.current = e.features![0].id;
			map.setFeatureState(
				{ source: sourceId.current, id: hoveredStateId.current, sourceLayer: name },
				{ hover: true }
			);
		}

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

	const onFilterLayerLeave = (name) => {
		if (hoveredStateId !== undefined && map && sourceId) {
			map.setFeatureState(
				{ source: sourceId.current, id: hoveredStateId.current, sourceLayer: name },
				{ hover: false }
			);
		}
		hoveredStateId.current = undefined;

		layerTooltip.remove();
		clearTooltipTimeout();
	};

	const PolygonFilterLayer = ({ color, name }) => {
		return (
			<>
				<Layer
					id={hoverLayer}
					type='fill'
					source-layer={name}
					layout={{}}
					paint={{
						'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.1, 0],
						'fill-color': color,
					}}
					beforeLayer='wells-layer'
					onClick={onFilterLayerClick}
					onMouseMove={(e) => onFilterLayerMove(e, name)}
					onMouseLeave={() => onFilterLayerLeave(name)}
				/>
				<Layer
					id={`${hoverLayer}-border`}
					type='line'
					source-layer={name}
					layout={{}}
					paint={{
						'line-color': color,
						'line-width': 2,
					}}
					beforeLayer='wells-layer'
				/>
			</>
		);
	};

	const LineFilterLayer = ({ name, color }) => {
		return (
			<Layer
				id={hoverLayer}
				type='line'
				source-layer={name}
				layout={{
					'line-cap': 'round',
				}}
				paint={{
					'line-color': color,
					'line-width': 10,
					'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0],
					'line-blur': 9,
				}}
				beforeLayer='wells-layer'
				onClick={onFilterLayerClick}
				onMouseMove={(e) => onFilterLayerMove(e, name)}
				onMouseLeave={() => onFilterLayerLeave(name)}
			/>
		);
	};

	const PointFilterLayer = ({ name, color }) => {
		return (
			<Layer
				id={hoverLayer}
				type='circle'
				source-layer={name}
				layout={{
					'line-cap': 'round',
				}}
				paint={{
					'circle-color': color,
					'circle-radius': 10,
					'circle-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0],
					'circle-blur': 0.5,
				}}
				beforeLayer='wells-layer'
				onClick={onFilterLayerClick}
				onMouseMove={(e) => onFilterLayerMove(e, name)}
				onMouseLeave={() => onFilterLayerLeave(name)}
			/>
		);
	};
	const FilterLayer = ({ shapeType, name, color, tooltipFields }) => {
		filterLayerTooltipFields = tooltipFields;
		let FilterLayer;
		if (shapeType === 'POLYGON') {
			FilterLayer = PolygonFilterLayer;
		} else if (shapeType === 'POLYLINE') {
			FilterLayer = LineFilterLayer;
		} else if (['POINT', 'MULTIPOINT'].includes(shapeType)) {
			FilterLayer = PointFilterLayer;
		}

		// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
		return FilterLayer ? <FilterLayer name={name} color={color} /> : <></>;
	};

	return { FilterLayer };
};
