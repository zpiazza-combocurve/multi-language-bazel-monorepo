import { omit } from 'lodash';

import { useDownloadFile } from '@/economics/Economics/shared/helpers';
import { LastRunSummaryQuery } from '@/economics/shared/queries';
import { isGHGReport, isPDFReport } from '@/economics/shared/shared';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { withLoadingBar } from '@/helpers/alerts';

import { CSVExportTemplateBase } from './CSVExportDialog/types';
import { downloadReport } from './ExportButton/helpers';
import { AllExportMenu } from './ExportButton/menus/AllExportMenu';
import { CSVExportMenu } from './ExportButton/menus/CSVExportMenu';
import { PDFExportMenu } from './ExportButton/menus/PDFExportMenu';
import { PDFExportTemplateBase } from './PDFExportDialog/shared/types';

export function ExportButton({
	runId,
	hasReservesGroups,
	scenarioTableHeaders,
	runningEconomics,
	ghgRunId,
	scenarioId,
	hasOneLiner,
}) {
	const [fileNameDialog, promptDownload] = useDownloadFile();

	const { isCustomPDFEditorEnabled } = useLDFeatureFlags();

	async function handleExport(props: CSVExportTemplateBase | PDFExportTemplateBase) {
		const template = omit(props, 'name');
		const isGHGRun = isGHGReport(template.type);
		const run = isGHGRun ? ghgRunId : runId;

		const result = await promptDownload(template);

		if (!result) return;

		const { fileName, bfitReport, afitReport } = result;

		const promise = downloadReport({
			...template,
			fileName,
			run,
			bfitReport,
			afitReport,
		});

		if (isPDFReport(template.type)) {
			// skip loading bar for pdf // why though?
			await promise;
		} else {
			await withLoadingBar(promise);
		}

		if (template.cashflowOptions?.type === 'monthly') {
			LastRunSummaryQuery.invalidate(scenarioId);
		}
	}

	const sharedMenuProps = {
		runId,
		runningEconomics,
		handleExport,
		scenarioTableHeaders,
		econRunExists: !!runId,
		ghgRunExists: !!ghgRunId,
		hasReservesGroups,
		hasOneLiner,
	};

	return (
		<>
			{fileNameDialog}
			{isCustomPDFEditorEnabled ? (
				<>
					<CSVExportMenu {...sharedMenuProps} />
					<PDFExportMenu {...sharedMenuProps} />
				</>
			) : (
				<AllExportMenu {...sharedMenuProps} />
			)}
		</>
	);
}
