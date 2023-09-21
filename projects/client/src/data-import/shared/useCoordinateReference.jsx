import { useEffect, useState } from 'react';

import { COORDINATE_REFERENCE_SYSTEMS } from './coordinateSystems';

export const useCoordinateReference = (fileImportCRS) => {
	const [coordinateReferenceSystem, setCoordinateReferenceSystem] = useState(
		fileImportCRS ?? COORDINATE_REFERENCE_SYSTEMS[0]
	);

	useEffect(() => setCoordinateReferenceSystem(fileImportCRS ?? COORDINATE_REFERENCE_SYSTEMS[0]), [fileImportCRS]);

	return { coordinateReferenceSystem, setCoordinateReferenceSystem };
};
