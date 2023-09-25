/**
 * Helpers for the "Async Command" pattern
 *
 * Overview: This pattern consists of defining transactions that involve executing multiple async tasks as a list of
 * functions to perform those tasks, rather than executing the tasks in-place. This makes the transaction definition
 * independent from how it is actually executed or when, providing flexibility while also keeping the list of tasks easy
 * to read and maintain.
 *
 * Terminology: - Task: the invocation of a function, usually returning a promise. e.g: Model.deleteOne({ _id }) -
 * Operation: a function that executes a task and returns the result. e.g: () => Model.deleteOne({ _id }) - Transaction:
 * a list of operations: e.g: [() => ForecastModel.deleteMany(query), () => ScenarioModel.deleteMany(query)]
 */

const internalAttr = Symbol('internal');
const keysAttr = Symbol('keys');

class ExecutorCollection {
	constructor(objectOrArray) {
		this[internalAttr] = Array.isArray(objectOrArray) ? new Array(objectOrArray.length) : {};
		this[keysAttr] = Object.keys(objectOrArray);
	}

	keys() {
		return this[keysAttr];
	}

	set(key, value) {
		this[internalAttr][key] = value;
	}

	value() {
		return this[internalAttr];
	}
}

/**
 * @example
 * 	const operations = [
 * 		() => ProjectModel.deleteOne(query),
 * 		() => ForecastModel.deleteMany(query),
 * 		() => ScenarioModel.deleteMany(query),
 * 	];
 * 	const array = await Executor.series(operations, { abort: false });
 *
 * 	// using objects
 * 	const operations = {
 * 		projects: () => ProjectModel.countDocuments(),
 * 		forecasts: () => ForecastModel.countDocuments(),
 * 		scenarios: () => ScenarioModel.countDocuments(),
 * 	};
 * 	const object = await Executor.series(operations);
 *
 * @function series
 * @param {Array | Object} operations - Array of operations (or key-value pairs)
 * @param {Object} [options]
 * @returns {Array | Object} - Resolved values for the given operations with the same type as the `operations` argument
 */

function series(operations, options = {}) {
	const { abort = true, limiter } = options;

	const collection = new ExecutorCollection(operations);
	const keys = collection.keys();

	return new Promise((resolve, reject) => {
		const next = async (index) => {
			const key = keys[index];
			const fn = operations[key];

			try {
				const ret = limiter ? await limiter.next(fn) : await fn();
				collection.set(key, ret);
			} catch (error) {
				if (abort) {
					reject(error);
					return;
				}
				collection.set(key, error);
			}
			if (index === keys.length - 1) {
				resolve(collection.value());
			} else {
				next(index + 1);
			}
		};

		if (keys.length) {
			next(0);
		} else {
			resolve(collection.value());
		}
	});
}

const Executor = { series };

const nameAttr = Symbol('command.name');

module.exports = { Executor, nameAttr };
