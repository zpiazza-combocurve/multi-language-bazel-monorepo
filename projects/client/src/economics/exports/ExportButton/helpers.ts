import { getTaggingProp } from '@/analytics/tagging';
import {
	AGG_CASHFLOW_PDF_EXPORT_TYPE,
	WELL_CARBON_REPORT_CSV_EXPORT_TYPE,
	WELL_CASHFLOW_PDF_EXPORT_TYPE,
} from '@/economics/Economics/shared/constants';
import { downloadExport, downloadFile as downloadFileFromId } from '@/helpers/routing';

import { buildByWellEconReport, buildEconCsvExport, buildEconReport, buildGhgReport, loadMultipleExport } from './api';

export function downloadFile(file) {
	const { gcpName, name } = file;

	return downloadExport(gcpName, name);
}

export async function buildAndDownloadMonthly(run, fileName, type) {
	let fileId = run?.econFiles?.byWellMonthlyCsv;
	if (!fileId) {
		fileId = await buildEconCsvExport({
			econRun: run._id,
			fileName,
			reportType: type,
			cashFlowReport: { monthly: true },
		});
	} else {
		return downloadFileFromId(fileId, fileName);
	}
}

export async function downloadReport({
	run,
	fileName,
	bfitReport,
	afitReport,
	...rest
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
	const { type } = rest;
	if (type === AGG_CASHFLOW_PDF_EXPORT_TYPE) {
		return await buildEconReport({
			...rest,
			fileName,
			econRun: run,
			bfitReport,
			afitReport,
			cashFlowReport: rest.cashflowOPtions,
		});
	}
	if (type === WELL_CASHFLOW_PDF_EXPORT_TYPE) {
		return await buildByWellEconReport({ ...rest, fileName, econRun: run, bfitReport, afitReport });
	}
	if (type === WELL_CARBON_REPORT_CSV_EXPORT_TYPE) {
		return downloadFile(await buildGhgReport({ fileName, ghgRun: run }));
	}
	await loadMultipleExport({
		reportType: type,
		fileName,
		econRun: run,
		cashFlowReport: rest.cashflowOptions,
		...rest,
	});
}

export function getExportTaggingProp(type: string) {
	switch (type) {
		case WELL_CASHFLOW_PDF_EXPORT_TYPE:
			return getTaggingProp('scenario', 'exportWellYearlyCashflow');

		case AGG_CASHFLOW_PDF_EXPORT_TYPE:
			return getTaggingProp('scenario', 'exportAggYearlyCashflow');

		case WELL_CARBON_REPORT_CSV_EXPORT_TYPE:
			return getTaggingProp('scenario', 'exportWellCarbonReport');

		default:
			return {};
	}
}
