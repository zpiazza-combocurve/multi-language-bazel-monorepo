import axios from 'axios';

import {
	API_BASE_URL,
	InterceptedAxiosInstance,
	addVersionRequestHeadersInterceptor,
	checkVersionResponseHeadersInterceptor,
	handleAxiosErrorInterceptor,
	unwrapDataInterceptor,
} from './routing-shared';

const axiosUnsecure = axios.create({ baseURL: API_BASE_URL }) as InterceptedAxiosInstance;

axiosUnsecure.interceptors.request.use(addVersionRequestHeadersInterceptor);
axiosUnsecure.interceptors.response.use(checkVersionResponseHeadersInterceptor);
axiosUnsecure.interceptors.response.use(unwrapDataInterceptor, handleAxiosErrorInterceptor);

export default axiosUnsecure;
