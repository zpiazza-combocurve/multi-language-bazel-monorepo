/* eslint no-async-promise-executor: "warn" */
import { create } from 'zustand';

import { failureAlert, infoAlert } from '@/helpers/alerts';
import { deleteApi, postApi, xhrFile } from '@/helpers/routing';
import { useSidebarVisibleStore } from '@/navigation/sidebar-visible-store';

interface File {
	name: string;
	gcpName: string;
	type: string;
	contents;
	link?: string;
	progress?: string;
}

export interface FilesUploadStore {
	filesUploading: File[];
	removeFile(gcpName: string): void;
}

export const useFilesUploadStore = create<FilesUploadStore>((set) => ({
	filesUploading: [],
	removeFile: (gcpName) =>
		set((p) => ({ ...p, filesUploading: p.filesUploading.filter((f) => f.gcpName !== gcpName) })),
}));

interface UploadFilesParams {
	files: File[];
	onSuccess: (params: { saved }) => void;
	onFailure?: (params: { errors; message: string }) => void;
	link?: string;
	removeOnComplete?: boolean;
	project?: Inpt.ObjectId<'project'>;
}

export async function uploadFiles({
	files,
	onSuccess,
	onFailure,
	project,
	link = `${window.location.pathname}${window.location.search}`,
	removeOnComplete = false,
}: UploadFilesParams) {
	// TODO several parts of this can be simplified, there's a helper (probably in routing) with some of this code modularized
	useSidebarVisibleStore.setState({ navVisible: true });
	infoAlert('Uploading. Please do not close or refresh your browser', 10000);

	// eslint-disable-next-line no-async-promise-executor -- TODO eslint fix later
	return new Promise(async (resolve, reject) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const saved: any[] = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const errors: any[] = [];

		useFilesUploadStore.setState({ filesUploading: [...useFilesUploadStore.getState().filesUploading, ...files] });

		for (const file of files) {
			try {
				const signedUrl = await postApi(`/files/get-signed-url`, {
					gcpName: file.gcpName,
					contentType: file.type,
				});

				const contents = file.contents;
				const fileIndex = useFilesUploadStore
					.getState()
					.filesUploading.findIndex((f) => f.gcpName === file.gcpName);

				const setLink = () => {
					const { filesUploading } = useFilesUploadStore.getState();
					if (filesUploading[fileIndex]) {
						filesUploading[fileIndex].link = link;
						useFilesUploadStore.setState({ filesUploading });
					}
				};

				try {
					await xhrFile({
						method: 'PUT',
						url: signedUrl,
						type: file.type,
						file: contents,
						onProgress: (progress) => {
							const { filesUploading } = useFilesUploadStore.getState();
							if (filesUploading[fileIndex]) {
								filesUploading[fileIndex].progress = progress.toString();
								useFilesUploadStore.setState({ filesUploading });
							}
						},
					});

					setLink();
				} catch (err) {
					setLink();
					failureAlert(`${file.name} upload failed`);
					// eslint-disable-next-line
					throw `${file.name} upload failed`; // TODO shouldn't throw text
				}

				delete file.contents;

				const fileToSave = project ? { ...file, project } : file;

				const savedFile = await postApi('/files/save-file-info', fileToSave);

				saved.push(savedFile);
			} catch (error) {
				failureAlert(`${file.name} upload failed`);
				deleteApi(`/files/delete-file/${file.gcpName}`);
				errors.push(error);
			}

			const sLength = saved.length;
			const eLength = errors.length;

			if (sLength + eLength === files.length) {
				if (eLength) {
					saved.forEach((f) => deleteApi(`/files/delete-file/${f.gcpName}`));
					// TODO need to throw error here
					// eslint-disable-next-line prefer-promise-reject-errors
					reject({ errors, message: 'All, if any, other files will be deleted.' });
					if (onFailure) {
						onFailure({ errors, message: 'All, if any, other files will be deleted.' });
					}
				} else {
					resolve({ saved });
					if (onSuccess) {
						onSuccess({ saved });
					}
				}

				if (removeOnComplete) {
					const ids = new Set();
					saved.forEach((s) => ids.add(s.gcpName));
					errors.forEach((e) => ids.add(e.gcpName));

					useSidebarVisibleStore.setState({ navVisible: false });

					const { filesUploading } = useFilesUploadStore.getState();
					useFilesUploadStore.setState({ filesUploading: filesUploading.filter((f) => !ids.has(f.gcpName)) });
				}
			}
		}
	});
}
