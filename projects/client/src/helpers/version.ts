import axios from 'axios';
import { isNil } from 'lodash-es';

const VERSION_REQUEST_HEADER = 'inpt-client-version';
const VERSION_RESPONSE_HEADER = 'inpt-client-latest';

let clientVersion;

export const getVersionRequestHeaders = () =>
	clientVersion
		? {
				[VERSION_REQUEST_HEADER]: clientVersion,
		  }
		: {};

const fetchVersion = () => {
	axios
		.get(`${window.location.origin}/version.json`, { params: { q: Date.now() } })
		.then((res) => {
			if (res?.data && typeof res.data === 'string') {
				clientVersion = res.data;
			}
		})
		// eslint-disable-next-line no-console
		.catch((error) => console.error(error));
};

if (process.env.NODE_ENV !== 'test') {
	fetchVersion(); // get version on page load and keep it in-memory
}

export const checkVersionResponseHeaders = (responseHeaders) => {
	const isLatestVersion = responseHeaders?.[VERSION_RESPONSE_HEADER];

	if (isNil(isLatestVersion)) {
		return;
	}
	if (!window?.setIsLatestVersion) {
		return;
	}
	window?.setIsLatestVersion(isLatestVersion);
};
