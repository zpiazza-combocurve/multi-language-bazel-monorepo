import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { getErrorInfo, getPublicErrorInfo } from '@src/helpers/errors';

import logger from '../helpers/logger';

import { ITenantCacheEntry } from './tenant-cache';

const { INTERNAL_SERVER_ERROR, BAD_REQUEST } = StatusCodes;

export const errorHandler = (): ErrorRequestHandler => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	return function errorHandler(error, req, res, next) {
		const info = getErrorInfo(error);
		const status = info.statusCode ?? (info.expected ? BAD_REQUEST : INTERNAL_SERVER_ERROR);

		// First send reply then deal with logging
		res.status(status).send(getPublicErrorInfo(info));

		const durationMillis = Date.now() - res.locals.startTime;
		const latency = {
			seconds: Math.floor(durationMillis / 1e3),
			nanos: Math.floor((durationMillis % 1e3) * 1e6),
		};
		const { cachedTenant } = res.locals as { cachedTenant: ITenantCacheEntry };
		const tenant = cachedTenant?.get('name') ?? 'Unknown';
		const labels = { tenant };
		const httpRequest = {
			remoteIp: req.connection.remoteAddress,
			requestMethod: req.method,
			requestUrl: req.originalUrl,
			status,
			referer: req.get('Referer'),
			userAgent: req.get('user-agent'),
			responseSize: (res.getHeader && Number(res.getHeader('Content-Length'))) || 0,
			latency,
		};
		const metadata: Record<string, unknown> = {
			httpRequest,
			labels,
			...info,
			internalMessage: error.internalMessage,
			stack: undefined,
			message: undefined,
		};
		if (error?.stack) {
			metadata.stackTrace = error.stack;
		}

		const message = error?.message ?? JSON.stringify(error);
		logger.log(status < 500 ? 'warn' : 'error', message, metadata);
	};
};
