/** @param {Function} fn - An async function */
const memoizeAsync = (fn) => {
	const cache = new Map();

	return async (...args) => {
		const key = JSON.stringify(args[0]);

		if (cache.has(key)) {
			return cache.get(key);
		}
		const ret = await fn(...args);
		cache.set(key, ret);
		return ret;
	};
};

module.exports = { memoizeAsync };
