import { useCallback, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { addFilesToDataImport } from '@/data-import/FileImport/api';
import { UploadStep } from '@/data-import/shared';
import { useUploadOptions as useUpload } from '@/data-import/shared/useUpload';
import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useProgressBar } from '@/helpers/progress';
import { handleSocket } from '@/helpers/socket';

import { PHDWIN_TEMPLATE } from '../data';

export function PHDWINUploadStep({ files: fileImportFiles, _id: fileImportId, completed, onNext }) {
	const { user, Pusher } = useAlfa();
	const files = useMemo(() => {
		const phdwinFile = fileImportFiles?.[0] || {};
		return [{ ...phdwinFile, ...PHDWIN_TEMPLATE }];
	}, [fileImportFiles]);

	const [progress, setProgress] = useState(null);
	const { isLoading: parsingPhdwinFile, mutateAsync: parsePhdwinFile } = useMutation(async ({ id, body }) => {
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
	const addfilesToImport = useCallback((id, body) => parsePhdwinFile({ id, body }), [parsePhdwinFile]);
	const { filesToUpload, ...uploadOptions } = useUpload({
		files,
		fileImportId,
		addFilesToDataImport: addfilesToImport,
		importType: 'phdwin',
	});
	const missingRequired = !filesToUpload?.[PHDWIN_TEMPLATE.name];
	return (
		<UploadStep
			completed={completed}
			onNext={onNext}
			{...uploadOptions}
			progress={progress}
			parsingPhdwinFile={parsingPhdwinFile}
			missingRequired={missingRequired}
			accept='.phz'
			normalSizeLimit={35}
			increasedSizeLimit={35}
			uploadType='phdwin'
		/>
	);
}
