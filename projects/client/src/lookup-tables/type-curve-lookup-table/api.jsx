import { useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';

const FORECAST_LOOKUP_TABLE = '/forecast-lookup-tables';
const LOOKUP_TABLE_HEADERS = '/lookup-tables/headers';
const LOOKUP_TABLE_MODELS = '/forecast-lookup-tables/assignments';

export function getLookupTables(body) {
	return getApi(FORECAST_LOOKUP_TABLE, body);
}

export function getLookupTable(id) {
	return getApi(`${FORECAST_LOOKUP_TABLE}/${id}`);
}

export function createLookupTable(body) {
	return postApi(FORECAST_LOOKUP_TABLE, body);
}

export function saveLookupTable(id, lookupTable) {
	return putApi(`${FORECAST_LOOKUP_TABLE}/${id}`, lookupTable);
}

export function validateLookupTable({ rules, project }) {
	return postApi(`${FORECAST_LOOKUP_TABLE}/validate`, { rules, project });
}

export function getLookupTablesItems(body) {
	return getLookupTables(body);
}

export function deleteLookupTable(id) {
	return deleteApi(`${FORECAST_LOOKUP_TABLE}/${id}`);
}

export function deleteLookupTables(ids) {
	return postApi(`${FORECAST_LOOKUP_TABLE}/mass-delete`, { ids });
}

export function getHeaderTypes() {
	return getApi(LOOKUP_TABLE_HEADERS);
}

export function getAssignmentValues({ projectId }) {
	return getApi(LOOKUP_TABLE_MODELS, { projectId });
}

export const getLookupTableQuery = (id) => ({
	queryKey: ['lookup-table', 'forecast', id],
	queryFn: () => getLookupTable(id),
});

export function useLookupTable(id, queryOptions = {}) {
	const queryClient = useQueryClient();
	const { isFetching: loading, data: lookupTable } = useQuery({ ...getLookupTableQuery(id), ...queryOptions });
	const refresh = useCallback(() => {
		queryClient.invalidateQueries(getLookupTableQuery(id).queryKey);
	}, [id, queryClient]);
	return { loading, lookupTable, refresh };
}

export function copyLookupTable(id, body) {
	return postApi(`${FORECAST_LOOKUP_TABLE}/${id}/copy`, body);
}

export function importLookupTable(id, body) {
	return postApi(`${FORECAST_LOOKUP_TABLE}/${id}/import`, body);
}

export function massImportLookupTables(body) {
	return postApi(`${FORECAST_LOOKUP_TABLE}/mass-import`, body);
}
