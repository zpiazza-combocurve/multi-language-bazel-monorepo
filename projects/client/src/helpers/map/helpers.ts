import booleanClockwise from '@turf/boolean-clockwise';
import kinks from '@turf/kinks';
import rewind from '@turf/rewind';
import union from '@turf/union';
import unkinkPolygon from '@turf/unkink-polygon';
import { Feature, Geometry, MultiPolygon, Point, Polygon, Position } from 'geojson';
import _ from 'lodash';

import { WELL_DEFAULT_COLOR, dimColor } from './colors';

export interface SingleWellProperties extends Record<string, unknown> {
	wellId: string;
}

export interface ClusterProperties extends Record<string, unknown> {
	geohash: string;
	point_count: number;
}

interface FinalSingleWellProperties extends SingleWellProperties {
	selected: boolean;
}

interface FinalClusterProperties extends ClusterProperties {
	label: string;
	selected: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const isSingleWellProperties = (properties: any): properties is SingleWellProperties =>
	properties?.wellId !== undefined;

export const areAllSamePoint = (points: Position[]) => {
	if (!points || !points.length) {
		return true;
	}
	const [x, y] = points[0];
	return points.every((p) => p[0] === x && p[1] === y);
};

const getFirstPoint = (geometry: Geometry): Position => {
	switch (geometry.type) {
		case 'Point':
			return geometry.coordinates;
		case 'LineString':
			return geometry.coordinates[0];
		case 'Polygon':
			return geometry.coordinates[0][0];
		case 'MultiPolygon':
			return geometry.coordinates[0][0][0];
		default:
			throw new Error('Unknown geometry type');
	}
};

export const toPointFeature = <TGeometry extends Geometry, TProperties>({
	geometry,
	properties,
}: Feature<TGeometry, TProperties>): Feature<Point, TProperties> => ({
	type: 'Feature',
	properties,
	geometry: {
		type: 'Point',
		coordinates: getFirstPoint(geometry),
	},
});

export const isSinglePointGeometry = <T>({ geometry }: Feature<Geometry, T>) =>
	geometry.type === 'Point' || (geometry.type === 'LineString' && areAllSamePoint(geometry.coordinates));

export const isSingleWell = (feature: Feature<Geometry, SingleWellProperties | ClusterProperties> | null) =>
	feature && (isSingleWellProperties(feature.properties) || (feature.properties?.point_count ?? 1) === 1);

export const hasProperty = (feature: Feature<Geometry, Record<string, unknown>>, property: string) =>
	(feature?.properties?.[property] ?? null) !== null;

export const getJoinedClusters = <TGeometry extends Geometry>(
	allWellsClusters: Array<Feature<TGeometry, SingleWellProperties | ClusterProperties>>,
	selectedWellsClusters?: Array<Feature<TGeometry, SingleWellProperties | ClusterProperties>>
): Array<Feature<TGeometry, FinalSingleWellProperties | FinalClusterProperties>> => {
	if (!selectedWellsClusters) {
		return allWellsClusters.map((feature) =>
			isSingleWellProperties(feature.properties)
				? { ...feature, properties: { ...feature.properties, selected: true } }
				: {
						...feature,
						properties: {
							...feature.properties,
							label: feature.properties?.point_count.toString(),
							selected: feature.properties?.point_count,
						},
				  }
		);
	}

	const [selectedSingleWells, selectedClusters] = _.partition(selectedWellsClusters, ({ properties }) =>
		isSingleWellProperties(properties)
	) as [Feature<TGeometry, SingleWellProperties>[], Feature<TGeometry, ClusterProperties>[]];
	const [allSingleWells, allClusters] = _.partition(allWellsClusters, ({ properties }) =>
		isSingleWellProperties(properties)
	) as [Feature<TGeometry, SingleWellProperties>[], Feature<TGeometry, ClusterProperties>[]];

	const selectedWellsSet = new Set(selectedSingleWells.map((feature) => feature.properties.wellId));
	const singleWellFeatures = allSingleWells.map((feature) => ({
		...feature,
		properties: { ...feature.properties, selected: selectedWellsSet.has(feature.properties.wellId) },
	}));

	const selectedClustersDict = Object.fromEntries(
		selectedClusters.map((feature) => [feature.properties.geohash, feature])
	);
	const clusterFeatures = allClusters.map((feature) => {
		const selectedCluster = selectedClustersDict[feature.properties.geohash];
		return {
			...feature,
			properties: {
				...feature.properties,
				label: `${selectedCluster?.properties.point_count ?? 0}/${feature.properties.point_count}`,
				selected: selectedCluster?.properties.point_count ?? 0,
			},
		};
	});

	return [...singleWellFeatures, ...clusterFeatures];
};

const getPolygons = (geometry: Geometry): Polygon[] => {
	switch (geometry.type) {
		case 'Polygon':
			return [geometry];
		case 'MultiPolygon':
			return geometry.coordinates.map((coordinates) => ({ type: 'Polygon', coordinates }));
		default:
			return [];
	}
};

export const getCoordinates = ({ coordinates }: Polygon) => coordinates;

export const getAllPolygons = (features: Feature[]) => features.map((feature) => getPolygons(feature.geometry)).flat();

export const getAllPolygonsCoordinates = (features: Feature[]) => getAllPolygons(features).map(getCoordinates);

export const isValidPolygon = (polygon: Polygon) => !kinks(polygon).features.length;

const isPolygonFeature = (feature: Feature): feature is Feature<Polygon> => feature.geometry.type === 'Polygon';
const isMultiPolygonFeature = (feature: Feature): feature is Feature<MultiPolygon> =>
	feature.geometry.type === 'MultiPolygon';

const removeConsecutiveDuplicatePoints = (points: Position[]) =>
	points.filter(([lon, lat], i) => i === 0 || points[i - 1][0] !== lon || points[i - 1][1] !== lat);

const makeCounterClockwise = (polygon: Polygon) =>
	polygon.coordinates.every(booleanClockwise) ? rewind(polygon) : polygon;

export const fixPolygon = (polygon: Polygon) =>
	unkinkPolygon({ ...polygon, coordinates: polygon.coordinates.map(removeConsecutiveDuplicatePoints) })
		.features.map(({ geometry }) => geometry)
		.map(makeCounterClockwise);

const fixMultiPolygon = (multiPolygon: MultiPolygon) =>
	multiPolygon.coordinates
		.map<Polygon>((polygonCoordinates) => ({ type: 'Polygon', coordinates: polygonCoordinates }))
		.map(fixPolygon)
		.flat();

export const fixPolygonFeature = (
	feature: Feature<Polygon> | Feature<MultiPolygon>
): Feature<Polygon | MultiPolygon> => {
	const fixedPolygons = isPolygonFeature(feature) ? fixPolygon(feature.geometry) : fixMultiPolygon(feature.geometry);
	if (fixedPolygons.length === 1) {
		return { ...feature, geometry: fixedPolygons[0] };
	}

	return {
		...feature,
		geometry: (fixedPolygons as Array<Polygon | MultiPolygon>).reduce(
			(prev, cur) => union(prev, cur)?.geometry ?? { type: 'Polygon', coordinates: [] }
		),
	};
};

export const fixFeatureIfPolygon = (feature: Feature) =>
	isPolygonFeature(feature) || isMultiPolygonFeature(feature) ? fixPolygonFeature(feature) : feature;

export const toFeature = <TGeometry extends Geometry>(
	geometry: TGeometry
): Feature<TGeometry, Record<string, never>> => ({
	type: 'Feature',
	properties: {},
	geometry,
});

export const LAYER_TYPES = {
	POINT: 'circle',
	POLYLINE: 'line',
	POLYGON: 'line',
	MULTIPOINT: 'circle',
	circle: 'circle',
	line: 'line',
	fill: 'fill',
	raster: 'raster',
} as const;

export const ifSelectedExpression = (valueSelected, valueUnselected, dimSelected = false) => {
	const selectedCase = dimSelected ? [valueUnselected, valueSelected] : [valueSelected, valueUnselected];
	return ['case', ['to-boolean', ['get', 'selected']], ...selectedCase] as ['case', ...unknown[]];
};
export const dimUnselectedExpression = (color, theme, dimSelected = false) =>
	ifSelectedExpression(color, dimColor(color, theme), dimSelected);
export const multiColorExpression = (valueColorPairs, defaultColor) =>
	valueColorPairs.length ? ['match', ['get', 'header']].concat(...valueColorPairs, [defaultColor]) : defaultColor;

export const getColorExpression = (headerColors, theme, dimSelected = false) => {
	const colorValues = headerColors.map(({ value }) => value) ?? [];
	const colors = headerColors.map(({ color }) => color) ?? [];

	const valueColorPairs = colorValues.filter((v) => v || v === '').map((v, i) => [v, colors[i]]);
	const defaultColor =
		colorValues.length && colorValues[colorValues.length - 1] === null
			? colors[colors.length - 1]
			: WELL_DEFAULT_COLOR;

	return multiColorExpression(
		valueColorPairs.map(([value, color]) => [value, dimUnselectedExpression(color, theme, dimSelected)]),
		dimUnselectedExpression(defaultColor, theme, dimSelected)
	);
};
