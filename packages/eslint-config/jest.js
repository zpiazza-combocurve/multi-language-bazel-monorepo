/* eslint-env node */
module.exports = {
	extends: ['plugin:jest/recommended', 'plugin:jest-dom/recommended'],
	rules: {
		'jest/expect-expect': 'off',
		'jest/no-export': 'error',
		'jest/valid-expect': 'error',
		'jest/no-mocks-import': 'error',
		'jest/no-standalone-expect': 'error',
	},
};
