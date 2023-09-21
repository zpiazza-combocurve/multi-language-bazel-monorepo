import { useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';

const LOOKUP_TABLE = '/lookup-tables';
const LOOKUP_TABLE_HEADERS = '/lookup-tables/headers';
const LOOKUP_TABLE_MODELS = '/lookup-tables/models';

export function getLookupTables(body) {
	return getApi(LOOKUP_TABLE, body);
}

export function getLookupTable(id) {
	return getApi(`${LOOKUP_TABLE}/${id}`);
}

export function createLookupTable({ name, configuration, project }) {
	return postApi(LOOKUP_TABLE, { name, configuration, project });
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

export function getLookupTablesItems(body) {
	return getLookupTables(body);
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

export const getLookupTableQuery = (id) => ({
	queryKey: ['lookup-table', id],
	queryFn: () => getLookupTable(id),
});

export function useLookupTable(id, queryOptions = {}) {
	const queryClient = useQueryClient();
	const { isFetching: loading, data: lookupTable } = useQuery({
		...getLookupTableQuery(id),
		...queryOptions,
	});
	const refresh = useCallback(() => {
		queryClient.invalidateQueries(getLookupTableQuery(id).queryKey);
	}, [id, queryClient]);
	return { loading, lookupTable, refresh };
}
