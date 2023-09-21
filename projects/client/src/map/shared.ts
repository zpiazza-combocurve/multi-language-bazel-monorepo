import { sortBy } from 'lodash-es';

import { getApi } from '@/helpers/routing';

import presetLayers from './data/presetLayers.json';
import { Shapefile } from './types';

export const MAP_POPUP_WELL_DATA_HEADERS = [
	'well_name',
	'well_number',
	'api14',
	'current_operator',
	'county',
	'status',
	'landing_zone',
	'first_prod_date',
	'true_vertical_depth',
	'perf_lateral_length',
	'total_fluid_per_perforated_interval',
	'total_proppant_per_perforated_interval',
];

export const INITIAL_PRESET_LAYERS_STATE = presetLayers.map((l) => ({ ...l, active: false, preset: true }));

export const getProjectFilter = (project: Pick<Inpt.Project, 'wells'>) => ({
	_id: 0,
	name: 'Project wells',
	excludeAll: true,
	include: project?.wells ?? [],
});

export async function getVisibleLayers(projectId: string) {
	const shapefilesDb = await (getApi(`/shapefiles/allShapefiles/${projectId}`) as Promise<Shapefile[]>);

	const layers = shapefilesDb.map((shapefile) => ({
		...shapefile,
		shSourceType: 'vector',
		filtering: false,
	}));

	return sortBy(layers, 'position');
}

export type Point = [number, number];
export type Bound = [number, number, number, number];
export type Polygon = Point[];

// TODO type wells property and make it more reusable for other geojson types thingy
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function getBounds(wells = [] as any[]): Bound | undefined {
	if (wells.length === 0) {
		return undefined;
	}
	let minLon = 180;
	let maxLon = -180;
	let minLat = 90;
	let maxLat = -90;
	wells.forEach(({ geometry: { type, coordinates } }) => {
		const points = type === 'Point' ? [coordinates] : coordinates;
		points.forEach(([lon, lat]) => {
			minLon = Math.min(lon, minLon);
			maxLon = Math.max(lon, maxLon);
			minLat = Math.min(lat, minLat);
			maxLat = Math.max(lat, maxLat);
		});
	});
	return [minLon, minLat, maxLon, maxLat];
}

export function getBoundCenter(bounds: Bound | undefined): Point | undefined {
	if (!bounds) {
		return undefined;
	}
	const [minLon, minLat, maxLon, maxLat] = bounds;
	return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
}
