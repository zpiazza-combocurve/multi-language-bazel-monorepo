import { StepManager } from '@/data-import/shared';

import { FileImportInfo } from '../FileImportInfo';
import { ARIESImportStep as ImportStep } from './ARIESImport/ImportStep';
import { ARIESMapStep as MapStep } from './ARIESImport/MapStep';
import { ARIESUploadStep as UploadStep } from './ARIESImport/UploadStep';

export function ARIESImport(fileImport) {
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
					status: [
						'mapped',
						'preprocessing',
						'queued',
						'failed',
						'started',
						'complete',
						'aries_started',
						'aries_complete',
					],
					component: ImportStep,
				},
			]}
		/>
	);
}
