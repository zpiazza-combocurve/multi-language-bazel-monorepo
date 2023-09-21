import { AGG_CASHFLOW_PDF_EXPORT_TYPE, WELL_CASHFLOW_PDF_EXPORT_TYPE } from '@/economics/Economics/shared/constants';

import type { PDFExportInputData } from './rhf';
import { PDFExportTemplate, ReportType } from './types';

export const reportTypesLabels = {
	[WELL_CASHFLOW_PDF_EXPORT_TYPE]: 'Well Cash Flow',
	[AGG_CASHFLOW_PDF_EXPORT_TYPE]: 'Aggregate Cash Flow',
} as const;

export const reportTypeValues = Object.keys(reportTypesLabels) as ReportType[];
export const reportTypesOptions = Object.entries(reportTypesLabels).map(([value, label]) => ({ value, label }));

export const ids = {
	dialog: 'pdf-dialog',
	reportType: 'report-type',
	name: 'template-name',
	reportTypePrefix: 'report-type-',
};

const cashflowTypes: { value: PDFExportTemplate['cashflowOptions']['type']; label: string }[] = [
	{ value: 'monthly', label: 'Monthly' },
	{ value: 'yearly', label: 'Yearly' },
	{ value: 'hybrid', label: 'Hybrid' },
];

const hybridYearTypes: { value: PDFExportTemplate['cashflowOptions']['hybridOptions']['yearType']; label: string }[] = [
	{ value: 'calendar', label: 'Calendar' },
	{ value: 'fiscal', label: 'Fiscal' },
];

const discCashflowType: { value: PDFExportTemplate['discCashflowOptions']; label: string }[] = [
	{ value: 'afit', label: 'Afit' },
	{ value: 'bfit', label: 'Bfit' },
	{ value: 'both', label: 'Both' },
];

export const Data: PDFExportInputData = {
	name: { id: ids.name, label: 'Name' },
	'cashflowOptions.type': { options: cashflowTypes },
	'cashflowOptions.hybridOptions.months': { id: '#-of-months', label: '# of Months' },
	'cashflowOptions.hybridOptions.yearType': { id: 'hybrid-year-type', options: hybridYearTypes },
	type: { id: ids.reportType, label: 'Report Type', options: reportTypesOptions },
	project: { label: 'Project' },
	discCashflowOptions: { id: 'discount-type', options: discCashflowType },
};

export const DEFAULT_SELECTED_ITEMS_LIMIT = 10;
export const TIME_SERIES_METRICS_SELECTED_ITEMS_LIMIT = 22;
export const DISCOUNT_SELECTED_ITEMS_LIMIT = 16;
