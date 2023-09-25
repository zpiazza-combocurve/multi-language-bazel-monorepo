/** Core abstractions for configuration management */

/**
 * @private
 * @interface ConfigReadOnlyBackend
 */
class ConfigReadOnlyBackend {
	// eslint-disable-next-line class-methods-use-this
	read() {
		throw new Error('Sub-class must implement this method');
	}
}

/**
 * @interface ConfigBackend
 * @public
 */
class ConfigBackend extends ConfigReadOnlyBackend {
	// eslint-disable-next-line class-methods-use-this
	write() {
		throw new Error('Sub-class must implement this method');
	}
}

/**
 * @class ConfigReadOnlyClient
 * @public
 */
class ConfigReadOnlyClient {
	constructor(backend) {
		this.backend = backend;
	}

	get(key) {
		return this.backend.read(key);
	}
}

/**
 * @class ConfigClient
 * @public
 */
class ConfigClient extends ConfigReadOnlyClient {
	set(key, data, options = {}) {
		return this.backend.write(key, data, options);
	}
}

module.exports = {
	ConfigBackend,
	ConfigReadOnlyClient,
	ConfigClient,
};
