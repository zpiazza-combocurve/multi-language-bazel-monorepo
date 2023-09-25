// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ErrorInfo } = require('./error-info');

/** @public */
class AppError extends Error {
	/**
	 * @param {object} properties
	 * @param {string} properties.kind
	 * @param {string} properties.message
	 * @param {object} [properties.details]
	 */
	constructor({ kind, message, details = null }) {
		super(message);

		this.name = this.constructor.name; // get the right name even when sub-classed

		this.kind = kind;
		this.message = message;
		this.details = details;
	}

	// eslint-disable-next-line class-methods-use-this
	getInfo() {
		throw new Error('Method must be implemented in subclass');
	}
}

/** @public */
class ServerError extends AppError {
	/**
	 * @param {object} properties
	 * @param {string} properties.kind
	 * @param {string} properties.message
	 * @param {object} [properties.details]
	 */
	constructor({ kind, message = 'Something went wrong', details = null }) {
		super({ kind, message, details });
		this.status = 500; // always status status 500
	}

	getInfo() {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({
			...this,

			message: this.message,
			expected: false,
			name: this.kind,
			user: false,
		});
	}
}

/** @public */
class CallerError extends AppError {
	/**
	 * @param {object} properties
	 * @param {string} properties.kind
	 * @param {string} properties.message
	 * @param {object} [properties.details]
	 * @param {number} [properties.status]
	 */
	constructor({ kind, message, details = null, status = 400 }) {
		super({ kind, message, details });
		this.status = status;
	}

	getInfo() {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({
			...this,

			message: this.message,
			expected: true,
			name: this.kind,
			user: false,
		});
	}
}

/** @public */
class UserError extends AppError {
	/**
	 * @param {object} properties
	 * @param {string} properties.kind
	 * @param {string} properties.message
	 * @param {object} [properties.details]
	 * @param {number} [properties.status]
	 */
	constructor({ kind, message, details = null, status = 400 }) {
		super({ kind, message, details });
		this.status = status;
	}

	getInfo() {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return ErrorInfo({
			...this,

			message: this.message,
			expected: true,
			name: this.kind,
			user: true,
		});
	}
}

/**
 * Helper to dynamically create error subclasses
 *
 * @public
 */
const createSubclass = (BaseErrorClass, kind, defaultParams = null) => {
	const subclass = class extends BaseErrorClass {
		constructor(params) {
			super({ ...defaultParams, ...params, kind });
			this.hasGetInfo = true;
		}
	};
	Object.defineProperty(subclass, 'name', { value: kind });
	return subclass;
};

module.exports = { AppError, CallerError, ServerError, UserError, createSubclass };
