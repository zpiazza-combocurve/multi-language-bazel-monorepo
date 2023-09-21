import { useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';

import { HeaderOptions, getProjectWellsHeadersCombinations } from '@/projects/api';

import { getEmbeddedLookupTable, getEmbeddedLookupTables } from './api';

export const EMBEDDED_LOOKUP_TABLES_BEGIN_QUERY_KEY = ['embedded-lookup-tables'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const useEmbeddedLookupTablesQuery = (filters: any, enabled: boolean) =>
	useQuery([...EMBEDDED_LOOKUP_TABLES_BEGIN_QUERY_KEY, filters], () => getEmbeddedLookupTables(filters), {
		enabled: filters && enabled,
	});

export const getEmbeddedLookupTableQuery = (eltId: string) => ({
	queryKey: [...EMBEDDED_LOOKUP_TABLES_BEGIN_QUERY_KEY, eltId],
	queryFn: () => getEmbeddedLookupTable(eltId as Inpt.ObjectId<'embedded-lookup-table'>),
});

export const useEmbeddedLookupTableQuery = (eltId: Inpt.ObjectId<'embedded-lookup-table'>) => {
	const queryClient = useQueryClient();

	const setData = useCallback(
		(data: Inpt.EmbeddedLookupTable) => {
			queryClient.setQueryData(getEmbeddedLookupTableQuery(eltId).queryKey, data);
		},
		[eltId, queryClient]
	);

	return {
		...useQuery({ ...getEmbeddedLookupTableQuery(eltId), enabled: !!eltId }),
		setData,
	};
};

export const useCurrentEmbeddedLookupTable = () => {
	const { embeddedLookupTableId } = useParams();

	return useEmbeddedLookupTableQuery(embeddedLookupTableId as Inpt.ObjectId<'embedded-lookup-table'>);
};

export const useHeadersCombinationsQuery = (
	projectId: Inpt.ObjectId<'project'> | undefined,
	headerOptions: HeaderOptions,
	enabled: boolean
) =>
	useQuery(
		['project-well-headers-combinations', projectId, headerOptions],
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		() => getProjectWellsHeadersCombinations(projectId!, headerOptions),
		{ enabled: !!projectId && headerOptions.headers.length > 0 && enabled }
	);
