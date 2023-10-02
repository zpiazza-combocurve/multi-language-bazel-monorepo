const baseConfig = require('./jest.config');

module.exports = {
	...baseConfig,
	// this should inherit the base configuration once added
	setupFiles: ['dotenv-flow/config'],
	setupFilesAfterEnv: ['./jest.setup.local.js'],
};
