// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const rp = require('request-promise');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { has } = require('../collections');

const formatRequest = ({ method, uri }, start, failStatus, willRetry) => {
	const duration = Date.now() - start;
	return `[${method.toUpperCase()}] ${uri} [${failStatus || 'OK'}] ${duration}ms${willRetry ? ' retry >' : ''}`;
};

function RoutingModule(baseUrlIn, headersIn = {}, defaultTriesIn = 1, baseOptionsIn = {}) {
	let baseUrl = baseUrlIn;
	let headers = headersIn;
	let defaultTries = defaultTriesIn;
	let baseOptions = baseOptionsIn;

	const setBaseUrl = (url) => {
		baseUrl = url;
	};

	const setHeaders = (input) => {
		headers = input;
	};

	const setDefaultTries = (tries) => {
		defaultTries = tries;
	};

	const setBaseOptions = (options) => {
		baseOptions = options;
	};

	const _tryReq = (option, tries = defaultTries) => {
		let curTries = tries;
		return new Promise(function retry(resolve, reject) {
			const start = Date.now();
			rp(option)
				.then((result) => {
					console.info(formatRequest(option, start)); // eslint-disable-line no-console
					resolve(result);
				})
				.catch((err) => {
					const shouldRetry = --curTries > 0;
					console.info(formatRequest(option, start, err.statusCode || 'Unknown', shouldRetry)); // eslint-disable-line no-console
					if (shouldRetry) {
						retry(resolve, reject);
					} else {
						reject(err.error || 'Something went wrong');
					}
				});
		});
	};

	const serializeQuery = (obj) => {
		const str = [];
		Object.keys(obj).forEach((key) => {
			if (has(obj, key)) {
				str.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
			}
		});

		return str.join('&');
	};

	const getUrl = (path, query = {}) =>
		Object.keys(query).length ? `${baseUrl}${path}?${serializeQuery(query)}` : baseUrl + path;

	const getApi = (url, query = {}, tries = defaultTries) => {
		const uri = getUrl(url, query);
		const option = {
			...baseOptions,
			uri,
			headers,
			json: true,
			method: 'GET',
		};

		return _tryReq(option, tries);
	};

	const postApi = (url, body, tries = defaultTries, form = {}) => {
		const uri = baseUrl + url;
		const option = {
			...baseOptions,
			uri,
			body,
			headers,
			json: true,
			method: 'POST',
		};

		if (Object.keys(form).length !== 0) {
			option.form = form;
		}

		return _tryReq(option, tries);
	};

	const putApi = (url, body, tries = defaultTries) => {
		const uri = baseUrl + url;
		const option = {
			...baseOptions,
			uri,
			body,
			headers,
			json: true,
			method: 'PUT',
		};

		return _tryReq(option, tries);
	};

	const patchApi = (url, body, tries = defaultTries) => {
		const uri = baseUrl + url;
		const option = {
			...baseOptions,
			uri,
			body,
			headers,
			json: true,
			method: 'PATCH',
		};

		return _tryReq(option, tries);
	};

	const deleteApi = (url, tries = defaultTries) => {
		const uri = baseUrl + url;
		const option = {
			...baseOptions,
			uri,
			headers,
			json: true,
			method: 'DELETE',
		};

		return _tryReq(option, tries);
	};

	return {
		deleteApi,
		getApi,
		getUrl,
		patchApi,
		postApi,
		putApi,
		serializeQuery,
		setBaseOptions,
		setBaseUrl,
		setDefaultTries,
		setHeaders,
	};
}

module.exports = RoutingModule;
