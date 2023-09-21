import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';
import { FilterResult } from '@/module-list/types';

import { ModuleListEmbeddedLookupTableItem } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function getEmbeddedLookupTables(filters: any): Promise<FilterResult<ModuleListEmbeddedLookupTableItem>> {
	return getApi('/embedded-lookup-tables', filters);
}

export function getEmbeddedLookupTable(
	eltId: Inpt.ObjectId<'embedded-lookup-table'>
): Promise<Inpt.EmbeddedLookupTable> {
	return getApi(`/embedded-lookup-tables/${eltId}`);
}

export function createEmbeddedLookupTable(
	params: Pick<Inpt.EmbeddedLookupTable, 'name' | 'assumptionKey' | 'configuration' | 'project' | 'rules' | 'lines'>
): Promise<Inpt.EmbeddedLookupTable> {
	return postApi('/embedded-lookup-tables', params);
}

export function updateEmbeddedLookupTable(
	eltId: Inpt.ObjectId<'embedded-lookup-table'>,
	params: Partial<Pick<Inpt.EmbeddedLookupTable, 'name' | 'rules' | 'lines' | 'configuration'>>
): Promise<Inpt.EmbeddedLookupTable> {
	return putApi(`/embedded-lookup-tables/${eltId}`, params);
}

export function deleteEmbeddedLookupTable(eltId: Inpt.ObjectId<'embedded-lookup-table'>): Promise<void> {
	return deleteApi(`/embedded-lookup-tables/${eltId}`);
}

export function deleteEmbeddedLookupTables(eltIds: Inpt.ObjectId<'embedded-lookup-table'>[]): Promise<number> {
	return postApi('/embedded-lookup-tables/mass-delete', eltIds);
}

export function copyEmbeddedLookupTable(
	eltId: Inpt.ObjectId<'embedded-lookup-table'>
): Promise<Inpt.EmbeddedLookupTable> {
	return postApi(`/embedded-lookup-tables/${eltId}/copy`);
}

export function importEmbeddedLookupTable(
	eltId: Inpt.ObjectId<'embedded-lookup-table'>,
	targetProjectId: Inpt.ObjectId<'project'>
): Promise<Inpt.EmbeddedLookupTable> {
	return postApi(`/embedded-lookup-tables/${eltId}/import`, { targetProjectId });
}

export function massImportEmbeddedLookupTables(
	ids: Inpt.ObjectId<'embedded-lookup-table'>[],
	targetProjectId: Inpt.ObjectId<'project'>
): Promise<Inpt.EmbeddedLookupTable> {
	return postApi(`/embedded-lookup-tables/mass-import`, { ids, targetProjectId });
}
