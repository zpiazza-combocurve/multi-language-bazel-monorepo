/** Lodash like array & object utilities */

const identity = (value) => value;

const findChild = (root, path) => {
	const pathArray = path.split('.');
	let parent = root;
	for (let p = 0; p < pathArray.length - 1; p += 1) {
		if (parent) {
			parent = parent[pathArray[p]];
		} else {
			return { parent: null, key: null };
		}
	}
	return { parent: parent || null, key: pathArray[pathArray.length - 1] };
};

function get(object, path, defaultValue) {
	// similar to _.get
	const { parent, key } = findChild(object, path);
	let value;
	if (parent) {
		value = parent[key];
	}
	return value === undefined ? defaultValue : value;
}

const has = (object, property) => {
	// similar to _.has
	// checks whether a property exists on the given object
	if (object === null) {
		return false;
	}

	return Object.prototype.hasOwnProperty.call(object, property);
};

const pick = (object, propOrArray) => {
	// similar to _.pick, the opposite of `omit`
	// return a subset of props from an object without mutating the original object
	if (object === null) {
		return {};
	}
	const included = typeof propOrArray === 'string' ? [propOrArray] : propOrArray;

	return included.reduce(
		(accumulator, key) => (has(object, key) ? { ...accumulator, [key]: object[key] } : accumulator),
		{}
	);
};

const omit = (object, propOrArray) => {
	// similar to _.omit, the opposite of `pick`
	// returns a new object excluding some props from the original object
	if (object === null) {
		return {};
	}
	const excluded = typeof propOrArray === 'string' ? [propOrArray] : propOrArray;

	return Object.keys(object).reduce(
		(accumulator, key) => (excluded.indexOf(key) === -1 ? { ...accumulator, [key]: object[key] } : accumulator),
		{}
	);
};

const mapValues = (object, iteratee) => {
	// similar to _.mapValues
	if (object === null) {
		return {};
	}
	return Object.keys(object).reduce(
		(accumulator, key, index) => ({
			...accumulator,
			[key]: iteratee(object[key], key, index),
		}),
		{}
	);
};

const mapKeys = (object, iteratee) => {
	// similar to _.mapValues
	if (object === null) {
		return {};
	}
	return Object.keys(object).reduce(
		(accumulator, key) => ({
			...accumulator,
			[iteratee(object[key], key, object)]: object[key],
		}),
		{}
	);
};

const invert = (object) => {
	// similar to _.invert
	if (object === null) {
		return {};
	}

	return Object.entries(object).reduce((accumulator, [key, value]) => ({ ...accumulator, [value]: key }), {});
};

const groupBy = (array, criteria) => {
	// similar to _.groupBy
	const predicate = typeof criteria === 'function' ? criteria : (item) => item[criteria];

	return (array || []).reduce((accumulator, item) => {
		const field = predicate(item);
		return {
			...accumulator,
			[field]: [...(accumulator[field] || []), item],
		};
	}, {});
};

function range(...args) {
	// similar to _.range
	// range([start=0], end, [step=1])
	let start = 0;
	const end = args[args.length > 1 ? 1 : 0];
	let step = 1;

	if (args.length > 1) {
		start = args[0];
	}
	if (args.length > 2) {
		step = args[2];
	}
	const indexes = [];
	for (let i = start; i < end; i += step) {
		indexes.push(i);
	}

	return indexes;
}

const uniq = (array) => {
	// similar to _.uniq
	return [...new Set(array)];
};

const difference = (array1, array2) => {
	// similar to _.difference
	const remove = new Set(array2);

	return array1.filter((item) => !remove.has(item));
};

const intersection = (array1, array2) => {
	// similar to _.intersection
	const set2 = new Set(array2);
	const inBoth = new Set();

	array1.forEach((item) => {
		if (set2.has(item)) {
			inBoth.add(item);
		}
	});

	return [...inBoth];
};

const sortBy = (array, iteratees = identity) => {
	// similar to _.sortBy
	const iterateesArray = Array.isArray(iteratees) ? iteratees : [iteratees];

	const createSortFn = (it) => {
		const getSortValue = typeof it === 'function' ? it : (object) => get(object, it);
		return (element1, element2) => {
			const sortValue1 = getSortValue(element1);
			const sortValue2 = getSortValue(element2);

			if (sortValue1 < sortValue2) {
				return -1;
			}
			if (sortValue1 > sortValue2) {
				return 1;
			}
			return 0;
		};
	};

	return iterateesArray.reduce((partial, it) => partial.sort(createSortFn(it)), array);
};

const take = (array, n = 1) => {
	// similar to _.take
	if (!(array && array.length)) {
		return [];
	}
	return array.slice(0, n >= 0 ? n : 0);
};

module.exports = {
	difference,
	get,
	groupBy,
	has,
	intersection,
	invert,
	mapKeys,
	mapValues,
	omit,
	pick,
	uniq,
	range,
	sortBy,
	take,
};
