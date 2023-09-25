import fetch, { RequestInit as FetchOptions, Response as FetchResponse } from 'node-fetch';

import { IPowerBIAuth } from './auth';
import { PBIRequestError } from './errors';

/**
 * @class
 * @classdesc Wrapper around the fetch package specialized in formatting requests and parsing responses to/from the PowerBI REST API.@class PowerBIFetchRequest
 */
export class PowerBIFetchRequest {
	static API_BASE_URL = 'https://api.powerbi.com/v1.0/myorg/';

	readonly url: string;
	readonly options: FetchOptions;

	private readonly auth: IPowerBIAuth;
	private responsePromise: Promise<FetchResponse> | null;

	constructor(uri: string, options: FetchOptions, auth: IPowerBIAuth) {
		this.url = PowerBIFetchRequest.API_BASE_URL + uri;
		this.options = options;

		this.auth = auth;
		this.responsePromise = null;
	}

	private fetch(url: string, options: FetchOptions) {
		return fetch(url, options);
	}

	exec() {
		this.responsePromise = this.auth.getToken().then((token) =>
			this.fetch(this.url, {
				...this.options,
				headers: { ...this.options.headers, Authorization: `Bearer ${token}` },
			})
		);

		return this;
	}

	async parse() {
		/**
		 * Special response headers:
		 *
		 * Requestid: Available for some operations. It can be useful for debugging. PBI support will ask for it.
		 *
		 * X-PowerBI-Error-Info: Available in some failed responses. Contains details about the error.
		 */
		const { url, options, responsePromise } = this;

		if (!responsePromise) {
			throw new Error('A request needs to be executed before parsing its response');
		}
		const response = await responsePromise;
		const text = await response.text();

		const { headers, ok, status } = response;
		const requestId = headers.get('requestid');

		if (ok) {
			const body = text ? JSON.parse(text) : undefined;
			return { body, meta: { requestId } };
		}

		throw new PBIRequestError({
			method: options.method || 'GET',
			url,
			status,
			requestId,
			response: text,
			pbiErrorInfo: headers.get('X-PowerBI-Error-Info'),
		});
	}

	toString() {
		return `${this.options.method?.toUpperCase() || 'GET'} ${this.url}`;
	}
}
