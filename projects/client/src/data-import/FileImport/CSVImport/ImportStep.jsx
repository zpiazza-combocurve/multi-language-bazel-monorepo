import { Box, Container, FormControlLabel, FormLabel, Radio, RadioGroup } from '@material-ui/core';
import { useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { Button, Text } from '@/components';
import { alerts } from '@/components/v2';
import { startImport, updateProjectWells } from '@/data-import/FileImport/api';
import { getImportMessage } from '@/data-import/FileImport/shared';
import { useFileImportProgress } from '@/data-import/FileImport/useFileImportProgress';
import { ImportData, MarginPaper } from '@/data-import/shared/Steps/ImportStep';
import { useAlfa } from '@/helpers/alfa';
import { postApi } from '@/helpers/routing';
import { useCurrentProject } from '@/projects/api';

import ImportSummary from '../ImportSummary';
import {
	WellTable,
	useImportModeSelection,
	useProductionImportModeSelection,
	useWellRows,
} from './ImportStep/WellTable';

export function CSVImportStep({
	_id: fileImportId,
	status,
	project: projectScope,
	wellsToUpdate,
	wellsToCreate,
	importMode: initialImportMode,
	replace_production: initialReplaceProduction,
	productionDailyFile,
	productionMonthlyFile,
}) {
	const { importOptions, importMode, handleImportModeChange, toggleNew, importNew, toggleExisting, updateExisting } =
		useImportModeSelection(initialImportMode);
	const { productionImportOptions, replaceProduction, productionImportMode, handleProductionImportModeChange } =
		useProductionImportModeSelection(initialReplaceProduction, importMode);
	const { updateProject: updateCurrentProject } = useCurrentProject();

	const { set, project } = useAlfa();

	const scope = projectScope ? 'project' : 'company';
	const queryClient = useQueryClient();
	// Why isn't this using mutateAsync?
	const { isLoading, mutate: generateWellInfo } = useMutation(async () => {
		await postApi(`/file-imports/${fileImportId}/generate-well-info`, {});
		queryClient.invalidateQueries(['file-import', fileImportId]);
	});
	useEffect(() => {
		if (!wellsToUpdate || !wellsToCreate) {
			generateWellInfo();
		}
	}, [wellsToUpdate, wellsToCreate, generateWellInfo]);

	const projectId = projectScope;

	const onImportFinish = useCallback(() => {
		if (scope === 'project') {
			updateProjectWells(projectId, async (newProj) => {
				const updated = { ...project, ...newProj };
				set({ project: updated });
				updateCurrentProject(updated);
			});
		}
	}, [scope, projectId, project, set, updateCurrentProject]);

	const { setImporting, importing } = useFileImportProgress(fileImportId, onImportFinish);

	const handleStartImport = useCallback(async () => {
		setImporting(true);
		await startImport(fileImportId, { importMode, replaceProduction });
	}, [fileImportId, importMode, replaceProduction, setImporting]);

	useEffect(() => {
		if (status === 'queued' || status === 'started' || status === 'preprocessing') {
			setImporting(true);
		}
		return undefined;
	}, [status, setImporting]);

	const [newRows, updatedRows, duplicatedWells] = useWellRows(wellsToCreate, wellsToUpdate);

	const wellsToImport = importNew && newRows?.length;
	const updatedWellsToImport = updateExisting && updatedRows?.length;
	const noWells = !(wellsToImport || updatedWellsToImport) || !importMode;

	const completed = status === 'complete';
	const started = importing || completed;

	return (
		<Container>
			<MarginPaper>
				<div
					css={`
						display: flex;
						& > *:not(:first-child) {
							margin-left: 0.5rem;
						}
					`}
				>
					<div>
						<FormLabel component='legend'>Wells Import Mode</FormLabel>
						<RadioGroup
							aria-label='import-mode'
							name='import-mode'
							row
							value={importMode}
							onChange={handleImportModeChange}
						>
							{importOptions.map(({ value, label }) => (
								<FormControlLabel
									key={value}
									value={value}
									control={<Radio />}
									label={label}
									disabled={started}
								/>
							))}
						</RadioGroup>
					</div>
				</div>
				<div
					css={`
						margin-top: 1rem;
						min-height: 20rem;
						display: flex;
						justify-content: space-between;
						& > * {
							flex: 0 0 calc(50% - 0.5rem);
						}
					`}
				>
					<WellTable
						label='New Wells'
						rows={newRows}
						selected={importNew}
						handleToggle={toggleNew}
						disabled={started}
						loading={isLoading}
					/>
					<WellTable
						label='Existing Wells'
						rows={updatedRows}
						selected={updateExisting}
						handleToggle={toggleExisting}
						disabled={started}
						loading={isLoading}
						duplicatedCount={duplicatedWells}
					/>
				</div>
				{productionImportOptions && (
					<div
						css={`
							display: flex;
							margin-top: 1rem;
							& > *:not(:first-child) {
								margin-left: 0.5rem;
							}
						`}
					>
						<div>
							<FormLabel component='legend'>Production Data Import Mode</FormLabel>
							<RadioGroup
								aria-label='production-import-mode'
								name='production-import-mode'
								value={productionImportMode}
								onChange={handleProductionImportModeChange}
							>
								{productionImportOptions.map(({ value, label }) => (
									<FormControlLabel
										key={value}
										value={value}
										control={<Radio />}
										label={label}
										disabled={started}
									/>
								))}
							</RadioGroup>
						</div>
					</div>
				)}
			</MarginPaper>
			<ImportData
				importing={importing}
				importingMessage={getImportMessage(status)}
				stats={!importing && <ImportSummary fileImportId={fileImportId} />}
			/>

			{noWells && (
				<Box mt={2} display='flex' justifyContent='flex-end'>
					<Text type='warning'>No Wells selected to import</Text>
				</Box>
			)}
			<Box mt={2} display='flex' justifyContent='flex-end'>
				<Button
					onClick={async () => {
						if (
							replaceProduction &&
							updatedWellsToImport &&
							(productionDailyFile || productionMonthlyFile) &&
							!(await alerts.confirm({
								title: 'Are you sure you want to overwrite production data?',
							}))
						) {
							return;
						}
						handleStartImport();
					}}
					disabled={started || !startImport || noWells}
					secondary
					transform
					raised
				>
					Start Import
				</Button>
			</Box>
		</Container>
	);
}
