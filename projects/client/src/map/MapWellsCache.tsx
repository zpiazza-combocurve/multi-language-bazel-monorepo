import { Feature } from 'geojson';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useQueries, useQueryClient } from 'react-query';

import { hashCode } from '@/helpers/hash';
import { useCustomCompareMemo } from '@/helpers/hooks';
import { postApi } from '@/helpers/routing';

import { TileRequestBody, WellsMapData } from './helpers';

export const MAP_TILE_QUERY_PREFIX = 'map-tile';

interface MapTileWellsData {
	allWells: Feature[];
	selectedWells?: Feature[];
}

interface MapTileData extends MapTileWellsData {
	allDataLoaded: boolean;
}

interface MapWellsCacheProps {
	geohashes: string[];
	allWellsBody: TileRequestBody;
	selectedWellsBody?: TileRequestBody;
}

interface MapWellsLoaderProps extends MapWellsCacheProps {
	onTileLoaded: (allWells: Feature[], selectedWells?: Feature[]) => void;
	onFinishLoading: (allWells: Feature[], selectedWells?: Feature[]) => void;
}

const QUERY_STALE_TIME = 5 * 60 * 1000;
const QUERY_CACHE_TIME = 10 * 60 * 1000;

const getPrefixes = (str: string) => _.range(1, str.length).map((i) => str.slice(0, i));

const arrayCompare = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export function useMapWellsCache({ geohashes, allWellsBody, selectedWellsBody }: MapWellsCacheProps) {
	const mapSessionCode = useMemo(
		() => hashCode(JSON.stringify({ allWellsBody, selectedWellsBody })),
		[allWellsBody, selectedWellsBody]
	);

	const queryClient = useQueryClient();

	const prefixGeohashes = geohashes.map((geohash) => {
		const prefixIndex = getPrefixes(geohash)
			.map((prefix) => queryClient.getQueryData<MapTileData>([MAP_TILE_QUERY_PREFIX, mapSessionCode, prefix]))
			.findIndex((data) => data?.allDataLoaded);
		return prefixIndex >= 0 ? geohash.slice(0, prefixIndex + 1) : geohash;
	});
	const geohashesToGet = _.uniq(prefixGeohashes);

	const queries = useQueries({
		queries: geohashesToGet.map((geohash) => ({
			queryKey: [MAP_TILE_QUERY_PREFIX, mapSessionCode, geohash],

			queryFn: async () => {
				if (!selectedWellsBody) {
					const { wells, allDataLoaded } = (await postApi('/map/getTile', {
						...allWellsBody,
						geohash,
					})) as WellsMapData;
					return {
						allWells: wells,
						allDataLoaded,
					};
				}

				const [{ wells: allWells, allDataLoaded }, { wells: selectedWells }] = await Promise.all([
					postApi('/map/getTile', {
						...allWellsBody,
						geohash,
					}) as Promise<WellsMapData>,
					postApi('/map/getTile', {
						...selectedWellsBody,
						geohash,
					}) as Promise<WellsMapData>,
				]);
				return {
					allWells,
					selectedWells,
					allDataLoaded,
				};
			},

			staleTime: QUERY_STALE_TIME,
			cacheTime: QUERY_CACHE_TIME,
		})),
	});

	const isLoading = queries.some(({ isLoading }) => isLoading);

	const queriesData = queries.map(({ data }) => data);
	const { allWells, selectedWells } = useCustomCompareMemo(
		() =>
			queriesData.reduce<MapTileWellsData>(
				({ allWells: cumAllWells, selectedWells: cumSelectedWells }, data) => {
					if (!data) {
						return { allWells: cumAllWells, selectedWells: cumSelectedWells };
					}

					const { allWells: tileAllWells, selectedWells: tileSelectedWells } = data as MapTileData;

					return {
						allWells: [...cumAllWells, ...tileAllWells],
						selectedWells:
							cumSelectedWells && tileSelectedWells
								? [...cumSelectedWells, ...tileSelectedWells]
								: undefined,
					};
				},
				{ allWells: [], selectedWells: [] }
			),
		queriesData,
		arrayCompare
	);

	return { isLoading, allWells, selectedWells };
}

export function MapWellsLoader({
	geohashes,
	allWellsBody,
	selectedWellsBody,
	onTileLoaded,
	onFinishLoading,
}: MapWellsLoaderProps) {
	const { isLoading, allWells, selectedWells } = useMapWellsCache({ geohashes, allWellsBody, selectedWellsBody });

	useEffect(() => {
		if (!isLoading) {
			onFinishLoading(allWells, selectedWells);
		}
	}, [isLoading, allWells, selectedWells, onFinishLoading]);

	useEffect(() => onTileLoaded(allWells, selectedWells), [allWells, selectedWells, onTileLoaded]);

	return null;
}
