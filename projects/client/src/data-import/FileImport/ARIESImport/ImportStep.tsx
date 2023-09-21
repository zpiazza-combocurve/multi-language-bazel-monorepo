import { Box, Container } from '@material-ui/core';

import { getTaggingProp } from '@/analytics/tagging';
import { Button } from '@/components/v2';
import { ariesImportingStatus, getAriesImportMessage } from '@/data-import/FileImport/shared';
import { ImportData, MarginPaper } from '@/data-import/shared/Steps/ImportStep';

import { useImportProgress, useStartImport } from '../ImportStep/useImportProgress';
import { useSettings } from '../ImportStep/useSettings';
import ImportSummary from '../ImportSummary';

export function ARIESImportStep({ _id: fileImportId, status, ariesSetting, project }: Inpt.FileImport) {
	const notStarted = status === 'mapped';
	const disabled = !notStarted;
	const { projectName, onlyForecast, selectedScenarios, selectedSetups, createElts, options, downloadReport } =
		useSettings(
			project,
			getTaggingProp('dataImport', 'ariesApplyScenario'),
			getTaggingProp('dataImport', 'ariesApplySetup'),
			ariesSetting,
			disabled
		);

	useImportProgress(fileImportId);

	const { handleStartImport, starting } = useStartImport(fileImportId, {
		onlyForecast,
		createElts,
		projectName,
		selectedScenarios,
		selectedSetups,
	});

	const importInProgress = ariesImportingStatus.includes(status);

	const canStart = projectName && !!selectedScenarios.length && !disabled && !starting;

	return (
		<Container>
			<MarginPaper>{options}</MarginPaper>
			<ImportData
				importing={importInProgress}
				importingMessage={getAriesImportMessage(status)}
				stats={!notStarted && !importInProgress && <ImportSummary fileImportId={fileImportId} />}
			/>
			<Box mt={2} display='flex' justifyContent='flex-end'>
				<Button onClick={downloadReport ?? undefined} disabled={!downloadReport} variant='outlined'>
					Download Error Report
				</Button>
				<Box ml={2} clone>
					<Button
						onClick={() => {
							handleStartImport();
						}}
						disabled={!canStart}
						color='secondary'
						variant='outlined'
					>
						Start Import
					</Button>
				</Box>
			</Box>
		</Container>
	);
}
