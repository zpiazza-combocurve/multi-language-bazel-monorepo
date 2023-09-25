import { ErrorRequestHandler } from 'express';

import { getClientInfo, getLogInfo } from '../helpers/errors';
import logger from '../helpers/logger';

const GENERIC_ERROR_MESSAGE = 'An error occurred, check log metadata for details';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO eslint fix later
const BAD_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO eslint fix later
const uncaughtExceptionHandler = (error, req, res, next) => {
	const message = error?.message ?? GENERIC_ERROR_MESSAGE;
	logger.error(`Uncaught exception: ${message}`, getLogInfo(error));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO eslint fix later
const uncaughtRejectionHandler = (error, req, res, next) => {
	const message = error?.message ?? GENERIC_ERROR_MESSAGE;
	logger.error(`Unhandled promise rejection: ${message}`, getLogInfo(error));
};

const errorHandlerMiddleware = (): ErrorRequestHandler => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO eslint fix later
	return function (error, req, res, next) {
		const message = error?.message ?? JSON.stringify(getClientInfo(error));
		res.status(INTERNAL_SERVER_ERROR).send(message);
		logger.error('error', getLogInfo(error));
	};
};

export { uncaughtExceptionHandler, uncaughtRejectionHandler, errorHandlerMiddleware };
