import { AxiosRequestConfig } from 'axios';
import _ from 'lodash-es';

import authClient from '@/login/authClient';

/**
 * Adds auth headers to the axios request
 *
 * @example
 * 	axios.interceptors.request.use(addAuthClientAccessTokenInterceptor);
 */
export async function addAuthClientAccessTokenInterceptor(config: AxiosRequestConfig) {
	const token = await authClient.getAccessToken();
	return _.merge({ headers: { Authorization: `Bearer ${token}` } }, config);
}
