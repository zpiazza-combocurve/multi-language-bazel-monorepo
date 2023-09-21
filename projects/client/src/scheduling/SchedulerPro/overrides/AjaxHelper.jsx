import { AjaxHelper } from '@bryntum/schedulerpro';

import authClient from '@/login/authClient';

export class AjaxHelperOverride {
	static get target() {
		return {
			class: AjaxHelper,
			product: 'schedulerpro',
		};
	}

	static async fetch(url, options = {}) {
		if (typeof AbortController !== 'undefined') {
			options.abortController = new AbortController();
			options.signal = options.abortController.signal;
		}

		if (!('credentials' in options)) {
			options.credentials = 'include';
		}

		if (options.queryParams) {
			const params = Object.entries(options.queryParams);
			if (params.length) {
				url +=
					(url.includes('?') ? '&' : '?') +
					params.map(([param, value]) => `${param}=${encodeURIComponent(value)}`).join('&');
			}
		}

		const token = await authClient.getAccessToken();

		const promise = new Promise((resolve, reject) => {
			fetch(url, {
				...options,
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			})
				.then((response) => {
					if (options.parseJson) {
						response
							.json()
							.then((json) => {
								response.parsedJson = json;
								resolve(response);
							})
							.catch((error) => {
								response.parsedJson = null;
								response.error = error;
								reject(response);
							});
					} else {
						resolve(response);
					}
				})
				.catch((error) => {
					error.stack = promise.stack;

					reject(error);
				});
		});

		promise.stack = new Error().stack;

		promise.abort = function () {
			options.abortController?.abort();
		};

		return promise;
	}
}
