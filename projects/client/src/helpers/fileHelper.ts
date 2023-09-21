import { has } from 'lodash-es';

import fileTypes from './file-types.json';

// TODO organize all file types, there are some in the files-upload module

export type FileType = {
	uploaded: Date;
	contents: File;
	bSize: number;
	extension: string;
	gcpName: string;
	mbSize: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	type: any;
	name: string;
	extensionError: boolean;
};

function parseFile(file: File, date: Date) {
	const nameArr = file.name.split('.');
	const dateTail = `--${date.toISOString()}`;
	const extension = nameArr.length > 1 ? `.${nameArr.pop()}`.toLowerCase() : '';
	const baseName = nameArr.join('.') || 'untitled';
	const name = baseName + dateTail + extension;
	return { name, extension };
}

/** @param file_ File document from input[type=file] */
export function sanitizeFile(file_: { contents: File } | File, { fromPaste }: { fromPaste?: boolean } = {}) {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const file: File = file_.contents ? file_.contents : file_;

	const date = new Date();
	const { name, extension } = parseFile(file, date);

	return {
		uploaded: date,
		contents: file,
		bSize: file.size,
		extension,
		gcpName: name,
		mbSize: file.size / 1000000,
		type: fileTypes[extension] || '',
		name: fromPaste ? name : file.name,
		extensionError: !has(fileTypes, extension),
	};
}

// TODO improve types
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const sanitizeFiles = (files: any[] = [], existingFiles = new Set(), fromPaste = false, noSizeLimit = false) => {
	const sendFiles = Array.from(files)
		.filter((f) => !existingFiles.has(f.name))
		.map((file) => sanitizeFile(file, { fromPaste }));
	const totalSize = sendFiles.reduce((total, { mbSize }) => total + mbSize, 0);

	return {
		sanitized: sendFiles,
		oversized: noSizeLimit ? false : totalSize >= 501,
	};
};

// TODO improve types
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const isOversized = (files: any[] = []) => {
	let totalSize = 0;
	files.forEach((f) => {
		totalSize += f.mbSize;
	});
	return totalSize >= 501;
};
