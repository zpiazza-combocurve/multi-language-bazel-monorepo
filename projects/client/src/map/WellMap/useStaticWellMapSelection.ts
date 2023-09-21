import { points } from '@turf/helpers';
import pointsWithinPolygon from '@turf/points-within-polygon';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { useCallback } from 'react';

import { Selection } from '@/components/hooks/useSelection';

import { WellGeoJson } from './WellsSource';

interface UseStaticWellMapSelectionProps {
	wells: WellGeoJson[];
	selection: Selection | undefined;
	isValidWell?: (well: WellGeoJson) => boolean;
}

const defaultIsValidWell = (well: WellGeoJson) => !well.properties.invalid;

const isPolygon = (feature: Feature): feature is Feature<Polygon | MultiPolygon> =>
	feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon';

const wellInPolygon = (well: WellGeoJson, polygon: Feature<Polygon | MultiPolygon>) => {
	const positions = well.geometry.type === 'Point' ? [well.geometry.coordinates] : well.geometry.coordinates;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return pointsWithinPolygon(points(positions) as any, polygon).features.length;
};

function useStaticWellMapSelection({
	wells,
	selection,
	isValidWell = defaultIsValidWell,
}: UseStaticWellMapSelectionProps) {
	const { select, toggle } = selection ?? {};

	const handleSelectionFeaturesChange = useCallback(
		(features: Feature[]) => {
			const polygons = features.filter(isPolygon);
			if (!select || !polygons.length) {
				return;
			}

			const selectedWells = wells
				.filter((w) => {
					return isValidWell(w) && !!polygons.some((polygon) => wellInPolygon(w, polygon));
				})
				.map(({ properties: { wellId } }) => wellId);

			select(selectedWells);
		},
		[wells, select, isValidWell]
	);

	const handleWellClick = useCallback(
		(wellFeature: WellGeoJson) => {
			if (!toggle || !isValidWell(wellFeature)) {
				return;
			}
			toggle(wellFeature.properties.wellId);
		},
		[toggle, isValidWell]
	);

	return { handleSelectionFeaturesChange, handleWellClick };
}

export default useStaticWellMapSelection;
