import _ from 'lodash';
import { useState } from 'react';

import { filterTypes } from '@/helpers/filters';
import { fixPolygon, getAllPolygons, getCoordinates } from '@/helpers/map/helpers';

const useMapFilter = (addFilter) => {
	const [mapFeatures, setMapFeatures] = useState([]);
	const setGeoFilter = (newMapFeatures) => {
		const newPolygons = getAllPolygons(newMapFeatures).map(fixPolygon).flat();
		const prevPolygons = getAllPolygons(mapFeatures).map(fixPolygon).flat();

		if (_.isEqual(prevPolygons, newPolygons)) {
			return;
		}

		setMapFeatures(newMapFeatures);
		addFilter({ type: filterTypes.geoFilter, polygons: newPolygons.map(getCoordinates) });
	};

	return { setGeoFilter, mapFeatures, setMapFeatures };
};

export { useMapFilter };
