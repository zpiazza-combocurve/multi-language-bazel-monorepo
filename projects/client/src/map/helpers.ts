import { Feature } from 'geojson';
import _ from 'lodash';

import { Filter } from '@/inpt-shared/filters/shared';

export interface TileRequestBody {
	filters: Filter[];
	headerParam?: string;
	project: Inpt.ObjectId | null;
	wellLabel?: string;
	extraHeaders?: string[];
	filterCount?: number;
}

export type WellsMapData = { wells: Feature[]; allDataLoaded: boolean };

const GEOHASH_MIN_LENGTH = 1;
const GEOHASH_MAX_LENGTH = 7;
const ZOOM_TO_GEOHASH_RATIO = 2 / 5;
const ZOOM_TO_GEOHASH_OFFSET = -1;

export const getMapTilesGeohashPrecision = (zoom: number) =>
	Math.min(
		Math.max(GEOHASH_MIN_LENGTH, Math.round(zoom * ZOOM_TO_GEOHASH_RATIO + ZOOM_TO_GEOHASH_OFFSET)),
		GEOHASH_MAX_LENGTH
	);

export const filtersWithoutGeo = (filters) =>
	filters.length ? [...filters.slice(0, filters.length - 1), _.omit(filters[filters.length - 1], 'geo')] : filters;

const filtersHaveGeo = (filters) => filters[filters.length - 1]?.geo;

const filtersHaveExcludeMode = (filters) => filters[filters.length - 1]?.isExcluding;

export const shouldShowDimmedWells = (filters) => filtersHaveGeo(filters) && !filtersHaveExcludeMode(filters);

export const layerIsSelectable = (layer) =>
	layer.gcpFolder && ['POLYGON', 'POLYLINE', 'POINT', 'MULTIPOINT'].includes(layer.shapeType);
