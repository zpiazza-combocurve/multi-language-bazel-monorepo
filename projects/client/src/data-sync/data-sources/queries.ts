import { useQuery } from 'react-query';

import { getApi } from '@/helpers/routing';

export const useDataSourceTypesQuery = (options?) =>
	useQuery<Inpt.DataSourceType[]>(['data-sources-data-source-types'], () => getApi('/data-sync/data-source-types'), {
		...options,
	});
