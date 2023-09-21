import { StepManager } from '@/data-import/shared';

import { FileImportInfo } from '../FileImportInfo';
import { PHDWINImportStep as ImportStep } from './PHDWINImport/ImportStep';
import { PHDWINUploadStep as UploadStep } from './PHDWINImport/UploadStep';

export function PHDWINImport(fileImport) {
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
					path: 'import',
					label: 'Import',
					status: [
						'mapped',
						'preprocessing',
						'queued',
						'failed',
						'started',
						'complete',
						'phdwin_started',
						'phdwin_complete',
					],
					component: ImportStep,
				},
			]}
		/>
	);
}
