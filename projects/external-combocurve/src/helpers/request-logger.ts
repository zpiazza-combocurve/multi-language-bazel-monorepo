import expressWinston from 'express-winston';
import { LoggingWinston } from '@google-cloud/logging-winston';
import { protos } from '@google-cloud/logging';
import { ServerResponse } from 'http';
import winston from 'winston';

import config from '@src/config';

import { getRequestTenant } from './tenant';

export const requestLogger = expressWinston.logger({
	transports: config.devEnv
		? [new winston.transports.Console()]
		: [
				new LoggingWinston({
					level: 'info',
					logName: 'external-combocurve-service-requests',
					serviceContext: {
						service: config.serviceName,
					},
				}),
		  ],
	metaField: null,
	responseField: null,
	requestWhitelist: [],
	responseWhitelist: ['body'],
	dynamicMeta: (req, res: ServerResponse) => {
		const meta = new protos.google.logging.v2.LogEntry();
		const httpRequest = new protos.google.logging.type.HttpRequest();
		const labels: { [k: string]: string } = {};

		meta.httpRequest = httpRequest;
		meta.labels = labels;

		if (req) {
			httpRequest.requestMethod = req.method;
			httpRequest.requestUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
			httpRequest.protocol = `HTTP/${req.httpVersion}`;
			httpRequest.userAgent = req.get('User-Agent') ?? '-';
			httpRequest.referer = req.get('Referer') ?? '-';
			labels['tenant'] = getRequestTenant(req);

			if (req.ip) {
				httpRequest.remoteIp =
					req.ip.indexOf(':') >= 0 ? req.ip.substring(req.ip.lastIndexOf(':') + 1) : req.ip;
			}
		}

		if (res) {
			httpRequest.status = res.statusCode;
		}

		return meta;
	},
});
