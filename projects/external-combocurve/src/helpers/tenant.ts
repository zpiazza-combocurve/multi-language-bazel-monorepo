import { ClientRequest, IncomingMessage } from 'http';
import { Request } from 'express';

import config from '../config';

const SERVICE_ACCOUNT_EMAIL_REGEX = /^ext(ernal)?-api-([^@]+)@/;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isHttpIncomingMessage(req: any): req is IncomingMessage {
	return req.headers !== undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isClientRequest(req: any): req is ClientRequest {
	return req.getHeader !== undefined;
}

export const getRequestTenant = (req: Request | IncomingMessage | ClientRequest): string => {
	let userInfoBase64: string | undefined | null;

	try {
		if (isHttpIncomingMessage(req)) {
			userInfoBase64 = req.headers['x-endpoint-api-userinfo']?.toString();
		} else if (isClientRequest(req)) {
			userInfoBase64 = req.getHeader('X-Endpoint-API-UserInfo')?.toString();
		}
	} catch {
		userInfoBase64 = null;
	}

	return parseTenantFromBase64UserInfo(userInfoBase64);
};

const parseTenantFromBase64UserInfo = (base64UserInfoHeader: string | undefined | null): string => {
	if (!base64UserInfoHeader) {
		if (config.devEnv) {
			return String(config.localEnv);
		}
		throw new Error('Missing user info header');
	}

	const userInfoJson = Buffer.from(base64UserInfoHeader, 'base64').toString('utf-8');
	const userInfo = JSON.parse(userInfoJson);
	const { issuer } = userInfo;

	const match = SERVICE_ACCOUNT_EMAIL_REGEX.exec(issuer);
	const tenant = match?.[2];
	if (!tenant) {
		throw new Error('Invalid service account email');
	}
	return tenant;
};
