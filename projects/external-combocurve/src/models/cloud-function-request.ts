import { ITenantHeaders } from '@src/headers';

export interface ICloudFunctionRequest {
	baseUrl?: string | undefined;
	functionName?: string | undefined;
	fullUrl: string | undefined;
	body?: unknown;
	headers: ITenantHeaders;
	maxRetries?: number;
}
