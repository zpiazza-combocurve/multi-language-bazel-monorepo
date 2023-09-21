import axios from 'axios';
import axiosRetry from 'axios-retry';

import {
	API_BASE_URL,
	AXIOS_RETRY_CONFIG,
	InterceptedAxiosInstance,
	addVersionRequestHeadersInterceptor,
	checkVersionResponseHeadersInterceptor,
	handleAxiosErrorInterceptor,
	unwrapDataInterceptor,
} from './routing-shared';
import { addAuthClientAccessTokenInterceptor } from './routing-shared-auth';

/**
 * Axios instance tunned for our communicating with the internal-api
 *
 * - Unwraps data from response
 * - Adds access tokens and necessary headers for api communication
 */
const axiosApi = axios.create({ baseURL: API_BASE_URL }) as InterceptedAxiosInstance;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
axiosRetry(axiosApi as any, AXIOS_RETRY_CONFIG);
axiosApi.interceptors.request.use(addAuthClientAccessTokenInterceptor);
axiosApi.interceptors.request.use(addVersionRequestHeadersInterceptor);
axiosApi.interceptors.response.use(checkVersionResponseHeadersInterceptor);
axiosApi.interceptors.response.use(unwrapDataInterceptor, handleAxiosErrorInterceptor);

export default axiosApi;
