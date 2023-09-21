import _ from 'lodash';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';

import { CSVExportTemplate, CSVExportTemplateDB, ScenarioTableColumn, SuggestedTemplates } from './types';

export function getReportTemplateRoute(suffix = '') {
	return `/economics/reports/${suffix}`;
}

export function createTemplate(template: CSVExportTemplate): Promise<CSVExportTemplateDB> {
	return postApi(getReportTemplateRoute(), _.omit(template, '_id'));
}

export function getDefaultTemplate(params): Promise<Pick<CSVExportTemplateDB, '_id'>> {
	return getApi(getReportTemplateRoute('default'), params);
}

export function setDefaultTemplate(template: {
	user?;
	_id: string | null;
	project: string;
	type: string;
}): Promise<CSVExportTemplateDB | null> {
	return putApi(getReportTemplateRoute('default'), template);
}

export function deleteTemplate(template): Promise<unknown> {
	return deleteApi(getReportTemplateRoute(template._id));
}

export function updateTemplate(template): Promise<{ nModified; n }> {
	return putApi(getReportTemplateRoute(), template);
}

export function getTemplates(props: { project?; type? } = {}): Promise<CSVExportTemplateDB[]> {
	return getApi(getReportTemplateRoute(), _.omitBy(props, _.isUndefined));
}

export function getTemplate(id): Promise<CSVExportTemplateDB | undefined> {
	return getApi(getReportTemplateRoute(id));
}

export function getSuggestedTemplates(runId, wellHeaders?: ScenarioTableColumn[]): Promise<SuggestedTemplates> {
	return postApi(getReportTemplateRoute(`getSuggested/${runId}`), { wellHeaders });
}

export function getProjectNames(projectIds: string[]): Promise<{ _id: string; name: string }[]> {
	return postApi('/projects/getProjectNames', { projectIds });
}
