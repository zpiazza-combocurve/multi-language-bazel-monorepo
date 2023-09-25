import { RequestInit as FetchOptions } from 'node-fetch';

import { IPowerBIAuth } from './utils/auth';
import { PowerBIFetchRequest } from './utils/fetch';

const DEFAULT_HEADERS_GET = {
	'Content-Type': 'application/x-www-form-urlencoded',
};

const DEFAULT_HEADERS_POST = {
	'Content-Type': 'application/json',
};

const DEFAULT_HEADERS_PATCH = DEFAULT_HEADERS_POST;

/**
 * @class
 * @classdesc Base class for specialized PowerBI client classes. Provides method-specific defaults for DRYing.
 */
export class PowerBIBaseClient {
	private readonly auth: IPowerBIAuth;

	constructor(auth: IPowerBIAuth) {
		this.auth = auth;
	}

	get(uri: string, options?: FetchOptions) {
		const { headers, ...rest } = options || {};
		return new PowerBIFetchRequest(
			uri,
			{
				...rest,
				method: 'GET',
				headers: { ...DEFAULT_HEADERS_GET, ...headers },
			},
			this.auth
		);
	}

	post(uri: string, body?: object | null | undefined, options?: FetchOptions) {
		const { headers, ...rest } = options || {};
		return new PowerBIFetchRequest(
			uri,
			{
				...rest,
				method: 'POST',
				headers: { ...DEFAULT_HEADERS_POST, ...headers },
				body: body ? JSON.stringify(body) : undefined,
			},
			this.auth
		);
	}

	patch(uri: string, body: object | null, options?: FetchOptions) {
		const { headers, ...rest } = options || {};
		return new PowerBIFetchRequest(
			uri,
			{
				...rest,
				method: 'PATCH',
				headers: { ...DEFAULT_HEADERS_PATCH, ...headers },
				body: body ? JSON.stringify(body) : undefined,
			},
			this.auth
		);
	}
}
