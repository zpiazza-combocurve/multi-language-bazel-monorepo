/** Client side error handling utilities @module */
import { titleize } from './text';

export const EXPECTED_ERROR_NAMES = {
	DOCUMENT_NOT_FOUND: 'DocumentNotFoundError',
};

export function getErrorMessage(error): string {
	if (typeof error === 'string') {
		return error;
	}
	if (error && typeof error === 'object' && error.message) {
		return error.message;
	}
	return '';
}

export function getErrorTitle(error): string {
	if (typeof error === 'string') {
		return titleize(error);
	}
	if (error && typeof error === 'object' && error.name) {
		return titleize(error.name);
	}
	return '';
}

export function errorFromInfo(errorInfo: {
	name?: string;
	message?: string;
	path?: string;
	expected?: boolean;
	details?;
}) {
	let message = 'Something went wrong';
	let name = 'Error';
	let path = '/';

	if (errorInfo.name) {
		name = errorInfo.name;
	}
	if (errorInfo.message) {
		message = errorInfo.message;
	}
	if (errorInfo.path) {
		path = errorInfo.path;
	}

	const error = new Error(message) as Error & { expected: boolean; details; path: string };
	error.expected = errorInfo.expected || false;
	error.details = errorInfo.details;
	error.name = name;
	error.path = path;
	return error;
}

export class ExpectedError extends Error {
	expected = true;
}
