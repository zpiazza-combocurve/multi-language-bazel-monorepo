// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth();

const cache = new Map();

/**
 * Can send an authenticated axios request or return the authentication headers. Uses the google service account
 * credential following the usual priority.
 *
 * Reference:
 *
 * - https://cloud.google.com/functions/docs/securing/authenticating#generating_tokens_programmatically
 * - https://cloud.google.com/run/docs/authenticating/service-to-service#acquire-token
 */
class GoogleCloudCaller {
	constructor(url) {
		this.url = url;
	}

	async init() {
		this.client = await auth.getIdTokenClient(this.url);
	}

	/** Gets an OAuth2 { Authorization: 'Bearer token' } header */
	async getAuthHeader() {
		return this.client.getRequestHeaders(this.url);
	}

	/**
	 * Send an authenticated axios request
	 *
	 * @param {any} options Request options same as axios
	 */
	request(options) {
		return this.client.request(options);
	}
}

async function getGoogleCloudCaller(url) {
	let caller = cache.get(url);
	if (caller) {
		return caller;
	}

	caller = new GoogleCloudCaller(url);
	await caller.init();
	cache.set(url, caller);
	return caller;
}

async function getAuthHeader(url) {
	const caller = await getGoogleCloudCaller(url);
	return caller.getAuthHeader();
}

/**
 * Sends a post request to a cloud function
 *
 * @param {any} baseUrl Base url of cloud functions
 * @param {any} functionName Function name
 * @param {any} fullUrl Full url of cloud function. Use this instead of baseUrl + functionName if it is set elsewhere
 * @param {any} body Data to post
 * @param {any} headers Set request headers
 */
async function callCloudFunction({ baseUrl, functionName, fullUrl, body, headers }) {
	const cfUrl = fullUrl || `${baseUrl}/${functionName}`;
	const caller = await getGoogleCloudCaller(cfUrl);
	const options = {
		data: body,
		method: 'POST',
		url: cfUrl,
		headers: { ...headers, 'Content-Type': 'application/json' },
	};
	const { data } = await caller.request(options);
	return data;
}

module.exports = { callCloudFunction, getAuthHeader, getGoogleCloudCaller };
