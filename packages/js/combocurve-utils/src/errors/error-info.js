function ErrorInfo({ details, expected, internalMessage, message, name, redirect, stack, status, user }) {
	/** Standard structure for serializing error information */
	return {
		details: details || null, // should not be exposed to front-end, except when expected: true
		expected: expected || false,
		internalMessage: internalMessage || null, // should never be exposed to front-end
		jsError: true,
		message: message || 'An error occurred',
		name: name || 'Error',
		redirect: redirect || false,
		stack: stack || null, // should not be exposed to front-end, except when in development
		status: status || null, // should not be exposed to front-end, except when in development
		user: user || false,
	};
}

module.exports = { ErrorInfo };
