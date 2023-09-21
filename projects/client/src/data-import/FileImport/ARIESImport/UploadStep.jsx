import { useCallback, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { addFilesToDataImport } from '@/data-import/FileImport/api';
import { UploadStep } from '@/data-import/shared';
import { useUploadOptions as useUpload } from '@/data-import/shared/useUpload';
import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useProgressBar } from '@/helpers/progress';
import { handleSocket } from '@/helpers/socket';

import { ARIES_EXTRA_TEMPLATE, ARIES_TEMPLATE } from '../data';

export function ARIESUploadStep({ files: fileImportFiles, _id: fileImportId, completed, onNext }) {
	const { user, Pusher } = useAlfa();
	const files = useMemo(() => {
		const ariesFile = fileImportFiles?.[0] || {};
		const ariesExtraFile = fileImportFiles?.find(({ category }) => category === 'extraFile') || {};
		return [
			{
				...ariesFile,
				...ARIES_TEMPLATE,
			},
			{
				...ariesExtraFile,
				...ARIES_EXTRA_TEMPLATE,
			},
		];
	}, [fileImportFiles]);

	const [progress, setProgress] = useState(null);
	const { isLoading: parsingAriesFile, mutateAsync: parseAriesFile } = useMutation(async ({ id, body }) => {
		const socketName = `data-import-${id}-upload`;
		const socket = handleSocket(
			Pusher,
			socketName,
			(resolve) =>
				({ progress: importProgress, success, failure, error }) => {
					if (success) {
						setProgress(null);
						resolve();
					}
					if (failure) {
						genericErrorAlert(error);
						resolve();
					}
					setProgress(importProgress);
				}
		);
		await addFilesToDataImport(id, { ...body, socketName, user: user._id });
		await socket;
	});

	useProgressBar(progress);

	const addfilesToImport = useCallback((id, body) => parseAriesFile({ id, body }), [parseAriesFile]);

	const { filesToUpload, ...uploadOptions } = useUpload({
		files,
		fileImportId,
		addFilesToDataImport: addfilesToImport,
		importType: 'aries',
	});
	const missingRequired = !filesToUpload?.[ARIES_TEMPLATE.name];
	return (
		<UploadStep
			completed={completed}
			onNext={onNext}
			{...uploadOptions}
			progress={progress}
			parsingAriesFile={parsingAriesFile}
			missingRequired={missingRequired}
			accept='.accdb,.mdb,.zip'
			normalSizeLimit={500}
			increasedSizeLimit={2048}
			uploadType='aries'
		/>
	);
}
