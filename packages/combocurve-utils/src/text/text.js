/**
 * Generates a name that doesn't exist within the existing names list in a similar way to windows explorer. For example:
 * Existing names: ['Nov', 'Dec'], base: 'Nov', suffix: 'Copy', result: 'Nov - Copy' Example 2: Existing names: ['Nov',
 * 'Nov - Copy', 'Dec'], base: 'Nov', suffix: 'Copy', result: 'Nov (2) - Copy'
 *
 * @param {any} base - The base of the name. For instance in 'Nov (2) - Copy', 'Nov' is the base
 * @param {any} existingNames - List of existing names to check uniqueness.
 * @param {any} inSuffix - Suffix to attach to base name.
 */
function genUniqueName(base, existingNames = [], inSuffix = '') {
	const suffix = inSuffix !== '' ? ` - ${inSuffix}` : '';
	let newName = `${base}${suffix}`;
	let isNotUnique = existingNames.includes(newName);
	let counter = 1;
	while (isNotUnique) {
		++counter;
		newName = `${base} (${counter})${suffix}`;
		isNotUnique = existingNames.includes(newName);
	}
	return newName;
}

function escapeRegExp(text) {
	// See: https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
	return text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function getAutoIncrementedName(name, existingNames, delimiter = ' ') {
	let max;
	const re = new RegExp(`^${escapeRegExp(name)}(${escapeRegExp(delimiter)}(\\d+))?$`);
	existingNames.forEach((existing) => {
		const match = re.exec(existing);
		if (match) {
			const [, , numberSuffix] = match;
			max = Math.max(max || 0, parseInt(numberSuffix || 0, 10));
		}
	});
	if (max === undefined) {
		return name;
	}
	return `${name}${delimiter}${max + 1}`;
}

module.exports = { escapeRegExp, genUniqueName, getAutoIncrementedName };
