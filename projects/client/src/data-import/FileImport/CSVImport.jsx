import { StepManager } from '@/data-import/shared';

import { FileImportInfo } from '../FileImportInfo';
import { CSVImportStep as ImportStep } from './CSVImport/ImportStep';
import { CSVMapStep as MapStep } from './CSVImport/MapStep';
import { CSVUploadStep as UploadStep } from './CSVImport/UploadStep';

export function CSVImport(fileImport) {
	const { status } = fileImport;

	return (
		<StepManager
			header={<FileImportInfo {...fileImport} />}
			status={status}
			sharedProps={fileImport}
			steps={[
				{
					path: 'upload',
					label: 'Upload',
					status: ['created'],
					component: UploadStep,
				},
				{
					path: 'map',
					label: 'Mapping',
					status: ['mapping'],
					component: MapStep,
				},
				{
					path: 'import',
					label: 'Import',
					status: ['mapped', 'preprocessing', 'queued', 'failed', 'started', 'complete'],
					component: ImportStep,
				},
			]}
		/>
	);
}
