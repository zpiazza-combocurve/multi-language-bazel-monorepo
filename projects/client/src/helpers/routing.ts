import { AxiosRequestConfig } from 'axios';

import { addDateTime } from '@/helpers/timestamp';

import axiosApi from './routing/axiosApi';
import { paramsSerializer } from './routing/routing-shared';
import { getFileNameExtension } from './utilities';

export const serializeQuery = paramsSerializer;

// TODO check if there is a browser alternative that does this
export const parseQuery = (queryString: string) => {
	let normalized = queryString || '';
	if (normalized[0] === '?') {
		normalized = normalized.slice(1);
	}
	return normalized
		.split('&')
		.filter(Boolean)
		.reduce((accumulator, param) => {
			const [key, value] = param.split('=');
			return { ...accumulator, [key]: decodeURIComponent(value) };
		}, {});
};

/** Similar to `axios.get` */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const getApi = <T = any>(url: string, params?: any, serializeParams = true) =>
	axiosApi.request<T>({
		url,
		params,
		method: 'get',
		paramsSerializer: serializeParams ? paramsSerializer : undefined,
	});

/** Similar to `axios.delete` */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const deleteApi = <T = any>(url: string, params?: any) => axiosApi.request<T>({ url, params, method: 'delete' });

/** Similar to `axios.post` */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const postApi = <T = any>(url: string, data?: any, options?: AxiosRequestConfig) =>
	axiosApi.request<T>({ ...options, url, data, method: 'post' });

/** Similar to `axios.put` */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const putApi = <T = any>(url: string, data?: any) => axiosApi.request<T>({ url, data, method: 'put' });

export const downloadFromUrl = (url: string, fileName?: string) => {
	// Creates a temp ref instead of opening a window to download. Window may be blocked by popup blocker
	const tmpRef = document.createElement('a');
	tmpRef.href = url;
	if (fileName) {
		tmpRef.download = fileName;
	}
	tmpRef.click();
};

export const downloadFileApi = async (url: string) => {
	const fileUrl = await getApi<string | undefined>(url);
	if (!fileUrl) throw Error('error');
	downloadFromUrl(fileUrl);
};

// TODO find axios alternative, see `onUploadProgress`
export async function xhrFile({ method, url, type, file, onProgress }) {
	return new Promise((rs, rj) => {
		const xhr = new XMLHttpRequest();
		xhr.open(method, url, true);

		if (onProgress) {
			xhr.upload.addEventListener('progress', (event) => {
				if (event.lengthComputable) {
					onProgress(parseInt(((event.loaded / event.total) * 100).toFixed(0), 10));
				}
			});
		}

		xhr.onload = () => {
			const status = xhr.status;

			if (status === 200) {
				rs(undefined);
			} else {
				rj(new Error('Error uploading file'));
			}
		};

		xhr.onerror = (error) => {
			rj(error);
		};

		xhr.setRequestHeader('Content-Type', type ?? file?.type);

		xhr.send(file);
	});
}

export async function uploadFile(
	sanitizedFile: ReturnType<typeof import('@/helpers/fileHelper').sanitizeFile>,
	{ onProgress }: { onProgress?: (progress: number) => void } = {},
	project?
): Promise<FileDocument> {
	// this 2 steps should be together in the server
	const { gcpName, type, contents, ...rest } = sanitizedFile;
	const signedUrl = await postApi(`/files/get-signed-url`, { gcpName, contentType: type });
	await xhrFile({ method: 'PUT', url: signedUrl, type, file: contents, onProgress });
	// save all file info but contents
	const fileInfo = project ? { gcpName, type, project, ...rest } : { gcpName, type, ...rest };
	return postApi('/files/save-file-info', fileInfo);
}

// Used in ModuleNavigation to format React-Router's Route and Link paths
export function usePagePath(baseUrl: string) {
	const pagePath = (p) => `${p.split('/').at(-1)}/*`;
	const pageTabPath = (p: string) => `${baseUrl}/${p}`;
	return { pagePath, pageTabPath };
}

/** Only words, digits, whitespaces, and dashes. Special characters cause Chrome to download the file as text */
export const cleanFileName = (fileName: string) => {
	const extensionPosition = fileName.lastIndexOf('.');
	const newFileName = fileName.substring(0, extensionPosition).replace(/[^\w\d\s-_]/g, '_');
	const extension = fileName.substring(extensionPosition);
	return newFileName + extension;
};

export const encodeFileName = (fileName) => {
	const newFileName = fileName.replace(/[%]/g, '_');
	return encodeURIComponent(newFileName);
};

export const downloadExport = async (gcpName: string, fileName: string) => {
	return downloadFileApi(`/files/downloadFile/${gcpName}/${cleanFileName(fileName)}`);
};

// For use with downloadFileV2 to allow for special characters in filename
export const downloadExportUnsafe = async (gcpName, fileName) => {
	return downloadFileApi(`/files/downloadFile/${gcpName}/${fileName}`);
};

export const getFile = (id: string) => getApi<FileDocument>(`/files/${id}`);

export async function downloadFile(fileOrId: string | FileDocument, downloadName?: string, defaultExtension = '.csv') {
	const file = typeof fileOrId === 'string' ? await getFile(fileOrId) : fileOrId;
	const { fileName, extension } = getFileNameExtension(file.name);
	const baseName = downloadName ?? fileName;
	const generatedFileName = `${addDateTime(baseName)}${extension || defaultExtension}`;
	return downloadExport(file.gcpName, generatedFileName);
}

/**
 * New file download helper allowing for expanded characters. Filenames can include special characters except '%'.
 * Filenames should also satisfy requirements placed by the various operating systems.
 *
 * @see https://en.wikipedia.org/wiki/Filename
 * @see https://stackoverflow.com/questions/4814040/allowed-characters-in-filename
 */
export async function downloadFileV2(
	fileOrId: string | FileDocument,
	downloadName?: string,
	defaultExtension = '.csv'
) {
	const file = typeof fileOrId === 'string' ? await getFile(fileOrId) : fileOrId;
	const { fileName, extension } = getFileNameExtension(file.name);
	const baseName = downloadName ?? fileName;
	const generatedFileName = `${baseName}${extension || defaultExtension}`;
	return downloadExportUnsafe(encodeURIComponent(file.gcpName), encodeFileName(generatedFileName));
}

export const openLink = (url: string) => window.open(url);

export async function redirectToZoho(redirectUrl?: string) {
	const url = await (redirectUrl
		? getApi('/user/get-helpdesk-url', { redirectUrl })
		: getApi('/user/get-helpdesk-url'));
	openLink(url);
}
