import { useCallback, useState } from 'react';

import { sanitizeFile } from '@/helpers/fileHelper';
import { uploadFile } from '@/helpers/routing';

type UploadStatus = 'not-started' | 'uploading' | 'complete' | 'failed';

export function useFileUpload() {
	const [status, setStatus] = useState<UploadStatus>('not-started');
	const [progress, setProgress] = useState(0);
	const [fileDocument, setFileDocument] = useState<FileDocument | undefined>();

	const upload = useCallback(async (file: File, project?: Inpt.ObjectId<'project'>) => {
		const sanitizedFile = sanitizeFile(file);
		setStatus('uploading');
		try {
			const createdFile = await uploadFile(sanitizedFile, { onProgress: setProgress }, project);
			setFileDocument(createdFile);
		} catch (e) {
			setStatus('failed');
			throw e;
		}
		setStatus('complete');
	}, []);

	return { upload, status, progress, fileDocument };
}
