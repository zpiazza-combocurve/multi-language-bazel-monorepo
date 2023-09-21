import { default as turfCircle } from '@turf/circle';
import { useEffect, useMemo } from 'react';

import Layer from '@/map/MapboxGL/Layer';
import Source from '@/map/MapboxGL/Source';
import { Bound, getBounds } from '@/map/shared';

interface RadiusSourceProps {
	centerCoordinates: number[];
	radius: number | undefined;
	setMapBounds?: (coordinates: Bound | undefined) => void;
}

// more units available
const options: { units: 'miles' } = { units: 'miles' };

const RadiusSource = ({ centerCoordinates, radius = 0, setMapBounds }: RadiusSourceProps) => {
	const circle = useMemo(() => {
		//  radius > ~1000 causes weird map results
		if (radius > 1000 || !centerCoordinates?.length) return undefined;
		return turfCircle(centerCoordinates, radius, options);
	}, [radius, centerCoordinates]);

	useEffect(() => {
		if (setMapBounds && circle && radius > 0) {
			const {
				coordinates: [circleCoords],
			} = circle.geometry;
			const inputForgetBoundsFunc = circleCoords.map((coords) => ({
				geometry: { type: 'Point', coordinates: coords },
			}));
			setMapBounds(getBounds(inputForgetBoundsFunc));
		}
	}, [circle, radius, setMapBounds]);

	return circle ? (
		<Source type='geojson' data={circle}>
			<Layer
				id='target-well'
				type='fill'
				paint={{
					'fill-opacity': 0.2,
					'fill-outline-color': 'yellow',
				}}
			/>
		</Source>
	) : null;
};

export default RadiusSource;
