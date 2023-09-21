import { uniq } from 'lodash-es';
import { useMemo, useState } from 'react';

import { Selection } from '@/components/hooks/useSelection';
import { useWellHeaderValues } from '@/forecasts/api';
import ProximityWellMap, { INVALID_COLOR } from '@/forecasts/proximity-forecast/ProximityWellMap';
import { PROXIMITY_TARGET_WELL_COLOR } from '@/helpers/zing';
import RadiusSource from '@/map/WellMap/RadiusSource';
import { WELL_COLOR } from '@/map/WellMap/WellsSource';
import { Bound } from '@/map/shared';

import { WellLegendControl } from './WellLEgendControl';
import { useTypeCurveInfo } from './useTypeCurveInfo';

const LAYERS = [
	{ key: 'rep', label: 'Rep. Wells', color: WELL_COLOR, tooltip: 'Representative wells' },
	{ key: 'invalid', label: 'Invalid & Excluded Wells', color: INVALID_COLOR, tooltip: 'Invalid and Excluded wells' },
];

const TARGET_LAYER = { key: 'target', label: 'Target Well', color: PROXIMITY_TARGET_WELL_COLOR, tooltip: '' };

interface TypeCurveWellsMapProps {
	typeCurveId: string;
	phase: string;
	wellIds: string[]; // make wellIds optional
	selection?: Selection;
	proximityWell?: string;
	proximityRadius?: number | undefined;
}

export const ProximityRadiusSource = ({ wellId, radius, setProximityBounds }) => {
	const wellHeaderQuery = useWellHeaderValues(wellId, 'all');
	const { data: wellHeaders } = wellHeaderQuery;

	const targetWellCoordinates = useMemo(() => {
		if (!wellHeaders || !wellHeaders.surfaceLatitude || !wellHeaders.surfaceLongitude) {
			return [];
		}

		return [wellHeaders.surfaceLongitude, wellHeaders.surfaceLatitude];
	}, [wellHeaders]);

	return <RadiusSource centerCoordinates={targetWellCoordinates} radius={radius} setMapBounds={setProximityBounds} />;
};

/**
 * Type Curve wells map for showing proximity wells, and allowing to select them. On addition to all the functionality
 * of the ProximityWellMap, supports:
 *
 * - Different mapLayers, showing invalid wells but not differentiating oil, gas and water.
 * - Different legend, reflecting the mapLayers shown.
 * - Showing the proximity radius and adjusting bounds accordingly.
 * - Using a Selection object, which enables the wells selection functionality of the StaticWellMap.
 */
function TypeCurveWellsMap({
	typeCurveId,
	phase,
	wellIds,
	selection,
	proximityWell,
	proximityRadius,
}: TypeCurveWellsMapProps) {
	const [proximityBounds, setProximityBounds] = useState<Bound>();

	const { phaseWellsInfo } = useTypeCurveInfo(typeCurveId, !!proximityWell);
	const { invalidWells = [], excludedWells = [] } = phaseWellsInfo[phase] ?? {};

	const wells = useMemo(() => {
		const invalidWellIds = [...invalidWells, ...excludedWells];
		const invalidWellsSet = new Set(invalidWellIds);
		const ret = uniq([...wellIds, ...invalidWellIds]).map((id) => ({
			id,
			layers: {
				rep: !invalidWellsSet.has(id),
				invalid: invalidWellsSet.has(id),
				selected: selection?.isSelected(id),
			},
		}));

		const wellsArr = proximityWell
			? [
					...ret, // Add target well to the end so that it will be drew at the end, which makes it on top
					{
						id: proximityWell,
						layers: {
							rep: false,
							invalid: false,
							target: true,
						},
					},
			  ]
			: ret;

		return Object.fromEntries(wellsArr.map(({ id, layers }) => [id, layers]));
	}, [excludedWells, invalidWells, proximityWell, wellIds, selection]);

	const layers = useMemo(() => (!proximityWell ? LAYERS : [TARGET_LAYER, ...LAYERS]), [proximityWell]);

	return (
		<ProximityWellMap
			wells={wells}
			mapLayers={layers}
			selection={selection}
			bounds={proximityBounds}
			boundsPadding={proximityBounds ? 0 : undefined}
			legend={<WellLegendControl proximityWell={proximityWell} />}
		>
			{proximityWell && (
				<ProximityRadiusSource
					wellId={proximityWell}
					radius={proximityRadius}
					setProximityBounds={setProximityBounds}
				/>
			)}
		</ProximityWellMap>
	);
}

export default TypeCurveWellsMap;
