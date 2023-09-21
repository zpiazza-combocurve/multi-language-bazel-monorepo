import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';

const LOOKUP_TABLE = '/schedules/lookup-tables';
const LOOKUP_TABLE_HEADERS = '/schedules/lookup-tables/headers';
const LOOKUP_TABLE_MODELS = '/schedules/lookup-tables/models';

export function getSchedulingLookupTables(query) {
	return getApi(LOOKUP_TABLE, query);
}

export function getLookupTable(id) {
	return getApi(`${LOOKUP_TABLE}/${id}`);
}

export function createLookupTable({ name, project, lines }) {
	return postApi(LOOKUP_TABLE, { name, project, lines });
}

export function copyLookupTable(lookupTableId, body) {
	return postApi(`${LOOKUP_TABLE}/${lookupTableId}/copy`, body);
}

export function saveLookupTable(id, lookupTable) {
	return putApi(`${LOOKUP_TABLE}/${id}`, lookupTable);
}

export function validateLookupTable({ rules, project }) {
	return postApi(`${LOOKUP_TABLE}/validate`, { rules, project });
}

export function importLookupTable(lookupTableId, body) {
	return postApi(`${LOOKUP_TABLE}/${lookupTableId}/import`, body);
}

export function massImportLookupTables(body) {
	return postApi(`${LOOKUP_TABLE}/mass-import`, body);
}

export function deleteLookupTable(id) {
	return deleteApi(`${LOOKUP_TABLE}/${id}`);
}
export function deleteLookupTables(ids) {
	return postApi(`${LOOKUP_TABLE}/mass-delete`, { ids });
}

export function getHeaderTypes() {
	return getApi(LOOKUP_TABLE_HEADERS);
}

export function getAssumptionsValues(projectId) {
	return getApi(LOOKUP_TABLE_MODELS, { projectId });
}

export function getHeadersValues(headers = [], projectId) {
	if (!headers.length) {
		return {};
	}
	return postApi(`${LOOKUP_TABLE_HEADERS}/values`, {
		headers,
		projectId,
	});
}

export function useLookupTables(projectId) {
	const { data: { items: lookupTables } = {} } = useQuery([projectId, 'scheduling-lookup-tables'], () =>
		getSchedulingLookupTables({
			projectId,
		})
	);
	return { lookupTables };
}

export function useLookupTable(id, queryOptions = {}) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['scheduling-lookup-table', id], [id]);
	const { isFetching: loading, data: lookupTable } = useQuery(queryKey, () => getLookupTable(id), queryOptions);
	const refresh = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);
	return { loading, lookupTable, refresh };
}
