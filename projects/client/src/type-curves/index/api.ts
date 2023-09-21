import { useQuery } from 'react-query';

import { fetchProjectForecasts } from '@/forecasts/api';
import { ProjectForecastItem } from '@/forecasts/types';

export function useProjectForecastIndex(projectId: string | undefined) {
	return useQuery(
		['type-curve-index', 'forecasts-by-project', projectId],
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		() => fetchProjectForecasts(projectId!) as Promise<ProjectForecastItem[]>,
		{ enabled: !!projectId }
	);
}
