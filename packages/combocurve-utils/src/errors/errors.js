// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { mapValues } = require('../collections/collections');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { pick } = require('../collections/collections');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ErrorInfo } = require('./error-info');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { AppError } = require('./primitives');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { DocumentNotFoundError } = require('./document-not-found');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { DuplicateValueError } = require('./duplicate-value-error');

// eslint-disable-next-line no-process-env
const { NODE_ENV } = process.env;

function checkDuplicateKey(error, message) {
	if (error.code === 11000) {
		return new DuplicateValueError(message, error.message);
	}
	return error;
}

const statusCodeMessage = (statusCode) => `Server responded with status code: ${statusCode}`;

const getResponseInfo = (responseBody) => {
	// only get the error information if we detect our standard error response structure
	if (responseBody.error && typeof responseBody.error === 'object') {
		// we have to be very specific about what fields we extract
		return pick(responseBody.error, ['expected', 'message', 'name']);
	}
	return null;
};

const getStatusCodeErrorInfo = (error) => {
	const { name, options, statusCode, response: { body } = {} } = error;

	const details = {
		uri: options && options.uri,
		method: options && options.method,
	};

	switch (typeof body) {
		case 'object':
			return {
				details,
				name,
				message: statusCodeMessage(statusCode),
				...getResponseInfo(body),
			};
		case 'string':
		default:
			return { details, name, message: statusCodeMessage(statusCode) };
	}
};

const getValidationErrorInfo = (error) => {
	const { message, name, errors } = error;

	return {
		message,
		name,
		details: mapValues(errors, (value) => pick(value, ['kind', 'message'])),
		expected: true,
	};
};

function internalGetErrorInfo(error) {
	/**
	 * Create `ErrorInfo` from an `Error` instance
	 *
	 * @private NOTE: Although in Javascript, unlike Python, is legal to throw anything, it is considered bad practice
	 *   to throw something that doesn't inherit from the `Error` class. To encourage use of best practices this
	 *   function will assume error is an object, which is the case for Error instances. Keep this in mind when
	 *   rejecting promises too, `reject` should always be called passing an Error. Same with callbacks :).
	 */

	if (error instanceof AppError || error?.hasGetInfo) {
		return error.getInfo();
	}
	switch (error.name) {
		case 'RequestError':
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			return ErrorInfo(error);
		case 'StatusCodeError':
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			return ErrorInfo(getStatusCodeErrorInfo(error));
		case 'ValidationError':
			// mongoose validation error
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			return ErrorInfo(getValidationErrorInfo(error));
		default:
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			return ErrorInfo({
				details: error.details,
				expected: error.expected || false,
				message: error.message || `Unknown Error: ${error.name}`,
				name: error.name || 'Error',
				redirect: error.redirect || false,
				internalMessage: error.internalMessage || null,
				stack: error.stack || null,
			});
	}
}

function getLogInfo(error) {
	/**
	 * Gets information from Error instances to be sent to logs
	 *
	 * @public
	 * @see internalGetErrorInfo
	 */
	return internalGetErrorInfo(error);
}

function getClientInfo(error) {
	/**
	 * Gets information from Error instances to be sent to the front-end
	 *
	 * @public
	 * @see internalGetErrorInfo
	 */
	const info = internalGetErrorInfo(error);

	const whitelist = ['expected', 'redirect'];

	if (info.expected || NODE_ENV === 'development') {
		whitelist.push('details', 'message', 'name');
	}

	if (NODE_ENV === 'development') {
		whitelist.push('stack');
	}

	return pick(info, whitelist);
}

class ErrorFactory {
	/**
	 * Create `ErrorInfo` when an `Error` instance doesn't exist.
	 *
	 * Useful in routes, for instance when checking the params/query/body.
	 */
	static invalidParams(message) {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({ message, expected: true, name: 'InvalidParameters' });
	}

	static unauthorized(message) {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({ message, expected: true, name: 'Unauthorized' });
	}

	static userNotfound(message) {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({ message, expected: true, name: 'UserNotFoundError' });
	}

	static invalidProject(message) {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({ message, expected: true, name: 'InvalidProject' });
	}

	static ImportError(message) {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({ message, expected: true, name: 'ImportError' });
	}

	static nameError(message) {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({ message, expected: true, name: 'NameError' });
	}

	static sessionError(message) {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({ message, expected: true, name: 'LoginExpired' });
	}

	static enterpriseUserError(message) {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({ message, expected: true, name: 'EnterpriseUser' });
	}
}

module.exports = {
	getClientInfo,
	getLogInfo,
	checkDuplicateKey,
	DuplicateValueError,
	DocumentNotFoundError,
	ErrorFactory,
};
