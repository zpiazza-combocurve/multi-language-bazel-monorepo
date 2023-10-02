import { IBQFilters } from './bq-queries';

const template =
	(strings: ReadonlyArray<string>, ...keys: string[]) =>
	(values: { [key in string]: string } | string[]): string => {
		// allows to do lazy substitution in template strings
		// source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
		const dict = !Array.isArray(values) ? values : {};
		const result = [strings[0]];
		keys.forEach(function (key, i) {
			const value = typeof key === 'number' ? values[key] : dict[key];
			result.push(value, strings[i + 1]);
		});
		return result.join('');
	};

// the "sql" tagged template literal allows to have SQL syntax highlighting with plugins like:
// https://marketplace.visualstudio.com/items?itemName=frigus02.vscode-sql-tagged-template-literals-syntax-only
const sql = template;

const table = (path: string): string => `\`${path}\``;

const buildWhereWithNamedParameters = (
	filters: Record<string, IBQFilters>,
): { whereQuery: string; params: Record<string, unknown> } => ({
	whereQuery: Object.keys(filters)
		.map((key) => `${key} ${filters[key].operator} @${key}`)
		.join(' AND '),
	params: Object.entries(filters).reduce<Record<string, unknown>>((acc, [key, { value }]) => {
		acc[key] = value;
		return acc;
	}, {}),
});

export { sql, table, buildWhereWithNamedParameters };
