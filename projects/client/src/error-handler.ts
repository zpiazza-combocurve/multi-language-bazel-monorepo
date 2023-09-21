// warning: experimental library
import axios from 'axios';
import axiosRetry from 'axios-retry';
import StackdriverErrorReporter from 'stackdriver-errors-js';

import {
	API_BASE_URL,
	AXIOS_RETRY_CONFIG,
	InterceptedAxiosInstance,
	addVersionRequestHeadersInterceptor,
	checkVersionResponseHeadersInterceptor,
	unwrapDataInterceptor,
} from '@/helpers/routing/routing-shared';
import { addAuthClientAccessTokenInterceptor } from '@/helpers/routing/routing-shared-auth';

const ERRORS_REPORTING_URL = '/api/client-errors';

/** Similar axios instance but without error handlers */
const axiosApiUnhandledErrors = axios.create({ baseURL: API_BASE_URL }) as InterceptedAxiosInstance; // TODO find alternative without having to do all this work

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
axiosRetry(axiosApiUnhandledErrors as any, AXIOS_RETRY_CONFIG);
axiosApiUnhandledErrors.interceptors.request.use(addAuthClientAccessTokenInterceptor);
axiosApiUnhandledErrors.interceptors.request.use(addVersionRequestHeadersInterceptor);
axiosApiUnhandledErrors.interceptors.response.use(checkVersionResponseHeadersInterceptor);
axiosApiUnhandledErrors.interceptors.response.use(unwrapDataInterceptor);

async function authenticatedErrorLogging(payload) {
	// if we use postApi here and it fails with 401 it will redirect the user to the login page
	// and we don't want that behaviour
	try {
		return axiosApiUnhandledErrors.post('/client-errors', payload);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(payload);
	}
}

let errorHandler;

// https://github.com/GoogleCloudPlatform/stackdriver-errors-js#usage-as-a-utility
// eslint-disable-next-line no-constant-condition
if (process.env.NODE_ENV === 'production' && false) {
	errorHandler = new StackdriverErrorReporter();
	errorHandler.start({
		customReportingFunction: authenticatedErrorLogging,
		targetUrl: ERRORS_REPORTING_URL,
	});
} else {
	// eslint-disable-next-line no-console
	errorHandler = { report: console.error };
}

export default errorHandler;
