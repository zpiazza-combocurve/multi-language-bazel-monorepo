import { isUndefined, omit, omitBy } from 'lodash';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';
import { pdfSchemaBase } from '@/inpt-shared/economics/pdf-reports/shared';

import { PDFExportTemplate, PDFExportTemplateBase, PDFExportTemplateDB, ReportType, SuggestedTemplates } from './types';

export function getReportTemplateRoute(suffix = '') {
	return `/economics/reports/pdf/${suffix}`;
}

export function getTemplates(props: { project?; type? } = {}): Promise<PDFExportTemplateDB[]> {
	return getApi(getReportTemplateRoute(), omitBy(props, isUndefined));
}

export function createTemplate(template: PDFExportTemplate): Promise<PDFExportTemplateDB> {
	return postApi(getReportTemplateRoute(), omit(template, '_id'));
}

export function getDefaultTemplate(params: { project: string; type: ReportType }): Promise<PDFExportTemplateDB> {
	return getApi(getReportTemplateRoute('default'), params);
}

export function setDefaultTemplate(template: {
	user?;
	_id: string | null;
	project: string;
	type: string;
}): Promise<PDFExportTemplateDB | null> {
	return putApi(getReportTemplateRoute('default'), template);
}

export function deleteTemplate(id: string): Promise<unknown> {
	return deleteApi(getReportTemplateRoute(id));
}

export function updateTemplate(template: PDFExportTemplate): Promise<PDFExportTemplateDB | undefined> {
	return putApi(getReportTemplateRoute(), template);
}

export function getTemplate(id: string): Promise<PDFExportTemplateDB | undefined> {
	return getApi(getReportTemplateRoute(id));
}

export function getSuggestedTemplates(): Promise<SuggestedTemplates> {
	return Promise.resolve({
		'cashflow-pdf': [
			{
				...pdfSchemaBase.validateSync({
					name: 'Well Cash Flow',
				} as Partial<PDFExportTemplateBase>),
				type: 'cashflow-pdf',
			},
		],
		'cashflow-agg-pdf': [
			{
				...pdfSchemaBase.validateSync({
					name: 'Aggregate Cash Flow',
				} as Partial<PDFExportTemplateBase>),
				type: 'cashflow-agg-pdf',
			},
		],
	});
}

export function getProjectNames(projectIds: string[]) {
	return postApi('/projects/getProjectNames', { projectIds });
}
