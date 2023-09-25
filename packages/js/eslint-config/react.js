/* eslint-env node */
module.exports = {
	extends: ['plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],
	rules: {
		'react/no-danger': 'error',
		'react/no-did-mount-set-state': 'error',
		'react/no-did-update-set-state': 'error',
		'react/no-invalid-html-attribute': 'error',
		'react/no-namespace': 'error',
		'react/no-redundant-should-component-update': 'error',
		'react/no-this-in-sfc': 'error',
		'react/no-unsafe': 'error',
		'react/no-unstable-nested-components': 'warn',
		'react/prefer-es6-class': 'error',
		'react/prefer-stateless-function': 'error',
		'react/self-closing-comp': ['error', { component: true, html: true }],
		'react/void-dom-elements-no-children': 'error',
		'react/jsx-boolean-value': 'error',
		'react/jsx-curly-brace-presence': 'error',
		'react/jsx-fragments': 'error',
		'react/jsx-no-constructed-context-values': 'warn',
		'react/jsx-no-comment-textnodes': 'error',
		'react/jsx-no-script-url': 'error',
		'react/no-unknown-property': ['error', { ignore: ['css'] }],
		'react/jsx-no-useless-fragment': 'warn',
		'react/jsx-handler-names': 'warn',

		'react-hooks/exhaustive-deps': ['error'],

		'react/display-name': 'off',
		'react/prop-types': 'off',
	},
};
