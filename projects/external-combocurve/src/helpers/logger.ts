import winston, { Logform } from 'winston';
import jsonStringify from 'fast-safe-stringify';
import { LoggingWinston } from '@google-cloud/logging-winston';
import { MESSAGE } from 'triple-beam';

import config from '../config';

const simpleTransform = (info: Logform.TransformableInfo) => {
	// This is the same as winston.format.simple() except the stringified part is formatted in a readable way
	// Copied from https://github.com/winstonjs/logform/blob/master/simple.js mostly
	const stringifiedRest = jsonStringify(
		Object.assign({}, info, {
			level: undefined,
			message: undefined,
			splat: undefined,
		}),
		undefined,
		2,
	);

	const padding = (info.padding && info.padding[info.level]) || '';
	if (stringifiedRest !== '{}') {
		info[MESSAGE] = `${info.level.toUpperCase()}:${padding} ${info.message} \n${stringifiedRest}`;
	} else {
		info[MESSAGE] = `${info.level.toUpperCase()}:${padding} ${info.message}`;
	}

	return info;
};

const getDevelopmentConfig = () => {
	const consoleFormat = winston.format(simpleTransform);

	return {
		level: 'verbose',
		transports: [new winston.transports.Console({ format: consoleFormat() })],
	} as winston.LoggerOptions;
};

const getProductionConfig = () =>
	({
		level: 'info',
		transports: [
			new LoggingWinston({
				level: 'info',
				logName: 'external-combocurve-service',
				serviceContext: {
					service: config.serviceName,
				},
			}),
		],
	}) as winston.LoggerOptions;

const getLoggerConfig = () => (config.environment === 'production' ? getProductionConfig() : getDevelopmentConfig());

const logger = winston.createLogger(getLoggerConfig());

export default logger;
