import produce from 'immer';
import { useCallback } from 'react';
import { create } from 'zustand';

import { postApi } from '@/helpers/routing';

const defaultProgress = { progress: 0, uploading: false, input: null };

// TODO duplicated code from `xhrFile` in helpers/routing file
async function xhrFile(method, url, file, { onProgress }) {
	const signedUrl = url;
	return new Promise((rs, rj) => {
		const xhr = new XMLHttpRequest();
		xhr.open(method, signedUrl, true);

		xhr.upload.addEventListener('progress', (event) => {
			if (event.lengthComputable) {
				onProgress(parseInt(((event.loaded / event.total) * 100).toFixed(0), 10));
			}
		});

		xhr.onload = () => {
			const status = xhr.status;

			if (status === 200) {
				rs(undefined);
			} else {
				rj(new Error('Error uploading file'));
			}
		};

		xhr.onerror = () => {
			rj(new Error('Error uploading file'));
		};

		xhr.setRequestHeader('Content-Type', file.type);

		xhr.send(file.contents);
	});
}

export async function apiUploadFile({ file, projectId, onProgress }) {
	const signedUrl = await postApi(`/files/get-signed-url`, { gcpName: file.gcpName, contentType: file.type });
	await xhrFile('PUT', signedUrl, file, { onProgress });
	const {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		contents,
		...fileInfo
	} = file;
	return postApi('/files/save-file-info', { ...fileInfo, project: projectId });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type Input = any; // TODO type it
interface FileUploadState {
	filesStatus: Record<string, { progress: number; uploading: boolean; input: Input | null }>;
	startProgress(key: string, input?: Input): void;
	trackProgress(key: string, value: number | null): void;
}

const useFileUploadStore = create<FileUploadState>((set) => ({
	filesStatus: {},
	startProgress: (key, input) =>
		set(
			produce((draft: FileUploadState) => {
				draft.filesStatus[key] = {
					...defaultProgress,
					...draft.filesStatus[key],
					progress: 0,
					uploading: true,
					input,
				};
			})
		),
	trackProgress: (key, value) =>
		set(
			produce((draft: FileUploadState) => {
				if (value === null) {
					// finished uploading
					draft.filesStatus[key] = defaultProgress;
				} else {
					draft.filesStatus[key] = {
						...defaultProgress,
						...draft.filesStatus[key],
						progress: value,
						uploading: true,
					};
				}
			})
		),
}));

function useProgressTracker() {
	const { startProgress, trackProgress } = useFileUploadStore(); // subscribe to changes
	const getter = useCallback((key: string) => useFileUploadStore.getState().filesStatus[key], []);
	return [getter, trackProgress, startProgress] as const;
}

export function useFileImportContext(projectId) {
	const [getFileInfo, onProgress, startProgress] = useProgressTracker();
	const [getBatchInfo, onBatchProgress, startBatch] = [getFileInfo, onProgress, startProgress]; // does it matter?
	const uploadFile = useCallback(
		(name, file) => apiUploadFile({ file, projectId, onProgress: (progress) => onProgress(name, progress) }),
		[onProgress, projectId]
	);
	const uploadBatch = useCallback(
		async ({ name: batchName, files }) => {
			// TODO clean this up?
			startBatch(batchName, { files });
			const filesNames = files.map(({ name }) => name);
			const getBatchProgress = () =>
				filesNames.reduce((acc, name) => acc + getFileInfo(name).progress, 0) / files.length;
			const recalculateProgress = () => onBatchProgress(batchName, getBatchProgress());
			const handleProgress = (name, progress) => {
				onProgress(name, progress);
				recalculateProgress();
			};
			files.forEach(({ name }) => onProgress(name, 0));
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const saved = [] as any[];
			// TODO should upload files in parallel?
			for (const { name, file, ...data } of files) {
				const result = await apiUploadFile({
					file,
					projectId,
					onProgress: (progress) => handleProgress(name, progress),
				});
				saved.push({ ...result, ...data });
			}
			onBatchProgress(batchName, null);
			return saved;
		},
		[onProgress, onBatchProgress, startBatch, getFileInfo, projectId]
	);
	return {
		uploadFile,
		getFileInfo,
		uploadBatch,
		getBatchInfo,
	};
}
