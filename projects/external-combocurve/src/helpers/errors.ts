import config from '../config';

export interface IPublicErrorInfo {
	name: string;
	message: string;
	details?: Record<string, unknown>;
	stack?: string;
}
export interface IErrorInfo extends IPublicErrorInfo {
	expected: boolean;
	statusCode?: number;
}

interface IExtendedError extends Error {
	expected?: boolean;
	statusCode?: number;
	details?: Record<string, unknown>;
}

export const getErrorInfo = (error: IExtendedError): IErrorInfo => ({
	name: error.name || 'Error',
	message: error.message || `Unknown Error: ${error.name}`,
	stack: error.stack,
	expected: error.expected || false,
	statusCode: error.statusCode,
	details: error.details,
});

const DEFAULT_PUBLIC_ERROR_INFO = {
	name: 'InternalServerError',
	message: 'An unexpected error occurred',
};

export const getPublicErrorInfo = (errorInfo: IErrorInfo): IPublicErrorInfo => {
	const { name, message, details, stack, expected, statusCode = 500 } = errorInfo;

	if (!expected && !config.devEnv && statusCode >= 500) {
		return DEFAULT_PUBLIC_ERROR_INFO;
	}

	const res = { name, message, details };
	if (config.devEnv) {
		return { ...res, stack };
	}
	return res;
};
