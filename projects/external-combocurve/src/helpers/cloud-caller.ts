// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { callCloudFunction as baseCallCloudFunction } from 'combocurve-utils/google-cloud-caller';
import retry from 'async-retry';

import config from '@src/config';
import { ICloudFunctionRequest } from '@src/models/cloud-function-request';

async function callCloudFunction<T>(request: ICloudFunctionRequest): Promise<T> {
	// allow caller to opt-out of retry logic
	if (request.maxRetries === 0) {
		return await baseCallCloudFunction(request);
	} else {
		return await retry<T>(
			async () => {
				return await baseCallCloudFunction(request);
			},
			{
				retries: request.maxRetries ?? config.cloudFunctionDefaultMaxRetries,
				maxTimeout: config.cloudFunctionMaxTimeoutSeconds * 1000,
			},
		);
	}
}

export { callCloudFunction };
