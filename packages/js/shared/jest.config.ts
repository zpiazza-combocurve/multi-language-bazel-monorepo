/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const dotenv = require('dotenv');

dotenv.config({ path: '.env.test' });

module.exports = {
	testEnvironment: 'node',
	rootDir: 'src/',
	preset: 'ts-jest/presets/js-with-ts',
	globalSetup: '../tests/globalSetup.ts',
	globalTeardown: '../tests/globalTeardown.ts',
	// It is very important to limit the spawned number of Jest workers on machines that have many cores,
	// otherwise the tests may run slower than with fewer workers, due to the database instance(s)
	// being hit very hard. Use either --maxWorkers 4 or --runInBand to limit the workers.
	maxWorkers: 4,
};
