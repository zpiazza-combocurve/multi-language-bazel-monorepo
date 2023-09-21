import { Box, Container } from '@material-ui/core';

import { getTaggingProp } from '@/analytics/tagging';
import { Button } from '@/components/v2';
import { getPhdwinImportMessage, phdwinImportingStatus } from '@/data-import/FileImport/shared';
import { ImportData, MarginPaper } from '@/data-import/shared/Steps/ImportStep';

import { useImportProgress, useStartPhdwinImport } from '../ImportStep/useImportProgress';
import { usePhdwinSettings } from '../ImportStep/useSettings';
import ImportSummary from '../ImportSummary';

export function PHDWINImportStep({ _id: fileImportId, status, project, ariesSetting }: Inpt.FileImport) {
	const notStarted = status === 'mapped';
	const disabled = !notStarted;
	const { projectName, options, selectedScenarios, downloadReport } = usePhdwinSettings(
		project,
		ariesSetting,
		disabled
	);

	useImportProgress(fileImportId);

	const { handleStartPhdwinImport, starting } = useStartPhdwinImport(fileImportId, {
		projectName,
		selectedScenarios,
	});

	const importInProgress = phdwinImportingStatus.includes(status);

	const canStart = projectName && !!selectedScenarios.length && !disabled && !starting;

	return (
		<Container>
			<MarginPaper>{options}</MarginPaper>
			<ImportData
				importing={importInProgress}
				importingMessage={getPhdwinImportMessage(status)}
				stats={!notStarted && !importInProgress && <ImportSummary fileImportId={fileImportId} />}
			/>
			<Box mt={2} display='flex' justifyContent='flex-end'>
				<Button onClick={downloadReport ?? undefined} disabled={!downloadReport} variant='outlined'>
					Download Error Report
				</Button>
				<Box ml={2} clone>
					<Button
						onClick={() => {
							handleStartPhdwinImport();
						}}
						disabled={!canStart}
						variant='outlined'
						color='secondary'
						{...getTaggingProp('dataImport', 'phdwinStartImport')}
					>
						Start Import
					</Button>
				</Box>
			</Box>
		</Container>
	);
}
