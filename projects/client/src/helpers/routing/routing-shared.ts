import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import _ from 'lodash';

import { errorFromInfo } from '@/helpers/errors';

import { checkVersionResponseHeaders, getVersionRequestHeaders } from '../version';

export const API_BASE_URL = `${window.location.origin}/api`;

export class AccessDeniedError extends Error {
	expected: true;

	constructor(...params: ConstructorParameters<typeof Error>) {
		super(...params);
		this.name = AccessDeniedError.name;
		this.expected = true;
	}
}

export class AuthorizationError extends Error {
	expected: true;
	errorData: object;

	constructor(errorData: object, ...params: ConstructorParameters<typeof Error>) {
		super(...params);
		this.name = AuthorizationError.name;
		this.expected = true;
		this.errorData = errorData;
	}
}

export function handleAxiosErrorInterceptor(error: AxiosError) {
	const { response } = error;
	if (!response) {
		// eslint-disable-next-line no-console
		console.error(error);
		throw error;
	}
	const { data, status } = response;

	if (status === 401) {
		throw new AuthorizationError(data);
	}

	if (status === 418) {
		const e = new AccessDeniedError('See admin about your level of permissions\nMaybe try refreshing your browser');
		// eslint-disable-next-line no-console
		console.error(e);
		throw e;
	}

	const errorInfo = data.error ? data.error : data;
	throw errorFromInfo(errorInfo);
}

export function addVersionRequestHeadersInterceptor(config: AxiosRequestConfig) {
	return _.merge({ headers: getVersionRequestHeaders() }, config);
}

export function checkVersionResponseHeadersInterceptor(response: AxiosResponse) {
	checkVersionResponseHeaders(response.headers);
	return response;
}

/** Only returns data value from the axios response */
export function unwrapDataInterceptor(response: AxiosResponse) {
	return response.data;
}

// TODO add some docs and check if this is really needed
export function paramsSerializer(params: object) {
	const str: string[] = [];
	Object.keys(params).forEach((p) => {
		if (_.has(params, p)) {
			str.push(`${encodeURIComponent(p)}=${encodeURIComponent(params[p])}`);
		}
	});
	return str.join('&');
}

/**
 * "Intercepted" meaning the request result will be the actual value, eg unwrapped, no need to `.data`, see below. types
 * taken from the axios definitions
 */
export type InterceptedAxiosInstance = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	<T = any>(config: AxiosRequestConfig): Promise<T>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
	getUri(config?: AxiosRequestConfig): string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	request<T = any>(config: AxiosRequestConfig): Promise<T>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	head<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
} & Pick<AxiosInstance, 'interceptors'>;

const AMOUNT_OF_RETRIES = 3;
const STATUSES_TO_RETRY = [502, 503];

export const AXIOS_RETRY_CONFIG = {
	retries: AMOUNT_OF_RETRIES,
	retryCondition: (error) => STATUSES_TO_RETRY.includes(error?.response?.status ?? 0),
	retryDelay: (retryCount) => Math.min(1000 * 2 ** retryCount, 10000),
};
