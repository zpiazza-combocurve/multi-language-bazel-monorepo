# @combocurve/eslint-config

Shared eslint configuration for combocurve repositories

## Installation

```shell
# npm
npm i --save-dev @combocurve/eslint-config
# yarn
yarn add --dev @combocurve/eslint-config
```

## Usage

Extend it from the eslint config:

```javascript
// .eslintrc.js
module.exports = {
	root: true,
	extends: [
		'@combocurve/eslint-config',
		// '@combocurve/eslint-config/react', // uncomment this line for react support
	],
	env: {
		es2022: true,
		// browser: true, // for react support
	},
	// settings: { react: { version: 'detect' } }, // uncomment this line for react support
	overrides: [
		{
			files: ['*.test.{tsx,ts,js}'],
			extends: ['@combocurve/eslint-config/jest'],
			env: { 'jest/globals': true },
			settings: { jest: { version: 28 } },
		},
	],
};
```

## References

-   https://eslint.org/
-   https://typescript-eslint.io/

Plugins:

-   https://www.npmjs.com/package/eslint-plugin-react
-   https://www.npmjs.com/package/eslint-plugin-react-hooks
-   https://www.npmjs.com/package/eslint-plugin-prettier

## TODO

-   [ ] Document eslint rules rationale
