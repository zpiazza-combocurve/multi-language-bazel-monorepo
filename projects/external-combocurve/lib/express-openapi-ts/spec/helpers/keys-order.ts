const getSortedKeys = <T>(object: T): (keyof T)[] =>
	Object.keys(object)
		.map((key) => key as keyof T)
		.sort();

const sortKeys = <T>(object: T): T =>
	getSortedKeys(object).reduce((accumulator, key) => ({ ...accumulator, [key]: object[key] }), {} as T);

export { getSortedKeys, sortKeys };
