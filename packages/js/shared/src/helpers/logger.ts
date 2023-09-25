import { LoggingWinston } from '@google-cloud/logging-winston';
import jsonStringify from 'fast-safe-stringify';
import { MESSAGE } from 'triple-beam';
import winston from 'winston';

import config from '../config';
import { getLogInfo } from './errors';

const getStackdriverTransport = (logName: string, serviceContext: string) =>
	new LoggingWinston({
		level: 'debug',
		logName,
		serviceContext: {
			service: serviceContext,
		},
	});

// This is the same as winston.format.simple() except the stringified part is formatted in a readable way
// Copied from https://github.com/winstonjs/logform/blob/master/simple.js mostly
const consoleFormat = winston.format((info) => {
	const stringifiedRest = jsonStringify(
		{ ...info, level: undefined, message: undefined, splat: undefined },
		undefined,
		2
	);

	const padding = (info.padding && info.padding[info.level]) || '';
	if (stringifiedRest !== '{}') {
		info[MESSAGE] = `${info.level}:${padding} ${info.message} \n${stringifiedRest}`;
	} else {
		info[MESSAGE] = `${info.level}:${padding} ${info.message}`;
	}

	return info;
})();

export const logger = winston.createLogger({
	level: 'debug',
});

export const initLogger = (logName: string, serviceContext: string) => {
	if (config.environment !== 'production') {
		logger.add(
			new winston.transports.Console({
				format: consoleFormat,
			})
		);
	} else {
		logger.add(getStackdriverTransport(logName, serviceContext));
	}
};

export const handleError = (error) => {
	const logInfo = getLogInfo(error);
	logger.log(logInfo?.expected ? 'warn' : 'error', logInfo);
};

export default logger;
