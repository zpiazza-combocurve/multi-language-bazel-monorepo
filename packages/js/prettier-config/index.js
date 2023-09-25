/* eslint-env node */
module.exports = {
	plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-jsdoc', 'prettier-plugin-packagejson'],
	importOrder: ['^@/(.*)$', '^[./]'],
	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
	importOrderParserPlugins: [
		'jsx',
		'typescript',
		'classProperties',
		'nullish-coalescing-operator',
		'optional-chaining',
		'logical-assignment-operators',
	],
};
