module.exports = {
	verbose: true,
	testEnvironment: 'node',
	preset: 'ts-jest',
	globalSetup: './src/test/setup.ts',
	globalTeardown: './src/test/teardown.ts',
	globals: {
		'ts-jest': {
			isolatedModules: true,
		},
	},
	clearMocks: true,
	coverageDirectory: 'coverage',
	collectCoverageFrom: ['./src/**'],
	coveragePathIgnorePatterns: ['/node_modules/', 'routes.ts', '/*.json', '/gen/'],
	coverageThreshold: {
		global: {
			lines: 85,
			branches: 70,
			statements: 85,
			functions: 85,
		},
	},
	reporters: ['default', 'github-actions'],
	roots: ['<rootDir>/src'],
	modulePaths: ['<rootDir>/src'],
	moduleDirectories: ['node_modules'],
	moduleNameMapper: {
		'^@src/(.*)$': '<rootDir>/src/$1',
		'^@test/(.*)$': '<rootDir>/test/$1',
	},
	testPathIgnorePatterns: ['/node_modules/', '/*.fixtures.test.ts'],
};
