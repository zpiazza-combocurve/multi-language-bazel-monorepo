import { postApi } from '../../helpers/routing';

export default {
	runWellCalcs: ({ wells }) => postApi('/well-calcs/runWellCalcs', { wells }),
	copyWells: ({ wells: wellIds, projectId }) => postApi('/well/copyWells', { wellIds, projectId }),
	validateWellSpacing: ({ wellIds, distanceType, zoneType, allWellIds }) =>
		postApi('/well-spacing/validate', { wellIds, distanceType, zoneType, allWellIds }),
	runWellSpacing: ({ wellIds, distanceType, zoneType, epsgNumber, allWellIds }) =>
		postApi('/well-spacing/run', { wellIds, distanceType, zoneType, epsgNumber, allWellIds }),
};
