import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';
import { fields as WELL_DAYS_DT } from '@/inpt-shared/display-templates/wells/well_days.json';
import { fields as WELL_DAYS_UNITS } from '@/inpt-shared/display-templates/wells/well_days_units.json';
import { fields as WELL_MONTHS_DT } from '@/inpt-shared/display-templates/wells/well_months.json';
import { fields as WELL_MONTHS_UNITS } from '@/inpt-shared/display-templates/wells/well_months_units.json';

const fileImportRoute = 'file-imports';

export function getFileImports(body) {
	return getApi(`/${fileImportRoute}`, body);
}

export function getFileImport(id) {
	return getApi(`/${fileImportRoute}/${id}`);
}

export function addFilesToDataImport(fileImportId, body) {
	return putApi(`/${fileImportRoute}/${fileImportId}/files`, body);
}

export function backToMapStep(fileImportId) {
	return postApi(`/${fileImportRoute}/${fileImportId}/back-to-map-step`);
}

export function updateDataImportMappings(fileImportId, body) {
	return putApi(`/${fileImportRoute}/${fileImportId}/mappings`, body);
}

export function completeMappings(fileImportId, body) {
	return postApi(`/${fileImportRoute}/${fileImportId}/finish-mapping`, body);
}

export function setDataSettings(fileImportId, body) {
	return postApi(`/${fileImportRoute}/${fileImportId}/data-settings`, body);
}

export function getSuggestedMappings(fileImportId, body) {
	return getApi(`/${fileImportRoute}/${fileImportId}/suggested-mappings`, body);
}

export function fetchTemplates() {
	return [WELL_DAYS_DT, WELL_DAYS_UNITS, WELL_MONTHS_DT, WELL_MONTHS_UNITS];
}

export function saveSetting(fileImportId, body) {
	return postApi(`/${fileImportRoute}/${fileImportId}/save-setting`, body);
}

export async function startImport(fileImportId, { importMode, replaceProduction = true }) {
	await putApi(`/${fileImportRoute}/${fileImportId}`, { importMode, replace_production: replaceProduction });
	return postApi(`/${fileImportRoute}/${fileImportId}/start-import`, { importMode });
}

export function assignProject(fileImportId, body) {
	return putApi(`/${fileImportRoute}/${fileImportId}/project`, body);
}

export function listMappings() {
	return getApi('/file-imports/mappings');
}

export function saveMappings(body) {
	return postApi(`/${fileImportRoute}/mappings`, body);
}

export function getMappingsById(mappingId) {
	return getApi(`/${fileImportRoute}/mappings/${mappingId}`);
}

export function deleteMappings(mappingId) {
	return deleteApi(`/${fileImportRoute}/mappings/${mappingId}`);
}

export function createFileImport(body) {
	return postApi(`/${fileImportRoute}/`, body);
}

export async function updateProjectWells(projectId, cb) {
	return cb(await getApi(`/projects/getProjectData/${projectId}`));
}

export function getScenariosList(fileImportId, body) {
	return getApi(`/${fileImportRoute}/${fileImportId}/scenarios`, body);
}

export function deleteFileImport(id, body) {
	return postApi(`/${fileImportRoute}/${id}/delete`, body);
}

export function useFileImport(id) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['file-import', id], [id]);
	const { isLoading, data: fileImport } = useQuery(queryKey, () => getFileImport(id));
	const updateImport = useCallback(
		(newFileImport) => {
			queryClient.setQueryData(queryKey, newFileImport);
		},
		[queryClient, queryKey]
	);

	const invalidateImport = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);

	return {
		fileImport,
		isLoading,
		queryKey,
		updateImport,
		invalidateImport,
	};
}
