import { useMemo } from 'react';
import { useQuery } from 'react-query';

import { getWellHeaderValues } from './api';

export const useWellHeaderValuesQuery = (
	wellId: Inpt.ObjectId<'well'> | undefined,
	headers: string[],
	projectId?: Inpt.ObjectId<'project'>
) => {
	const key = useMemo(() => ['well-header-values', wellId, headers, projectId], [wellId, headers, projectId]);

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	return useQuery(key, () => getWellHeaderValues(wellId!, headers, projectId), {
		enabled: !!wellId && headers.length > 0,
	});
};
