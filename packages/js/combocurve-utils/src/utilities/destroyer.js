/** Helpers for cascading delete linked mongoose models */
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Executor, nameAttr } = require('./executor');

class DestroyerError extends Error {
	constructor(message) {
		super(message);
		this.name = DestroyerError.name;
	}
}

function isMongooseModel(value) {
	return typeof value === 'function' && value.name === 'model';
}

function getModelName(model) {
	return model.modelName;
}

function isConfigObject(value) {
	return value && typeof value === 'object' && !Array.isArray(value);
}

function isDestroyer(value) {
	return (
		value &&
		typeof value === 'object' &&
		typeof value.constructor === 'function' &&
		value.constructor.name === 'Destroyer'
	);
}

function ensureParentRef(value) {
	if (value && typeof value === 'string') {
		return value;
	}
	throw new DestroyerError('Invalid value for: parentRef');
}

function ensureValidChild(config /* ChildConfig */) {
	const { destroyer, model } = config;

	if (destroyer) {
		if (isDestroyer(destroyer)) {
			return config;
		}
		throw new DestroyerError('Invalid value for: destroyer');
	} else if (model) {
		if (isMongooseModel(model)) {
			return config;
		}
		throw new DestroyerError('Invalid value for: model');
	} else {
		throw new DestroyerError('Invalid value for: model/destroyer: none provided');
	}
}

class DestroyerChild {
	constructor(modelOrConfig, parentRef = null) {
		if (isMongooseModel(modelOrConfig)) {
			this.config = {
				batchSize: null,
				destroyer: null,
				model: modelOrConfig,
				parentRef: ensureParentRef(parentRef),
			};
		} else if (isConfigObject(modelOrConfig)) {
			this.config = ensureValidChild({
				batchSize: modelOrConfig.batchSize || null,
				parentRef: ensureParentRef(modelOrConfig.parentRef || parentRef),
				destroyer: modelOrConfig.destroyer || null,
				model: modelOrConfig.model || null,
			});
		} else {
			throw new DestroyerError('Invalid child config object');
		}
	}
}

const operationsAttr = Symbol('operations');
const limiterAttr = Symbol('limiter');

class DestroyerTransaction {
	constructor(operations, limiter) {
		this[operationsAttr] = operations;
		this[limiterAttr] = limiter;
	}

	operations() {
		return this[operationsAttr];
	}

	exec() {
		return Executor.series(this[operationsAttr], { limiter: this[limiterAttr] });
	}
}

function decorateCommand(command, model) {
	return Object.assign(command, { [nameAttr]: `destroy(${getModelName(model)})` });
}

function createBulkDelete(model, query, batchSize, limiter) {
	if (!batchSize) {
		const command = () => model.deleteMany(query);
		return decorateCommand(command, model);
	}
	const createSubCommand = (ids) => () => model.deleteMany({ _id: { $in: ids } });
	const command = async () => {
		const cursor = model.find(query).select('_id').cursor();
		const subCommands = [];
		let batch = [];
		await cursor.eachAsync((doc) => {
			batch.push(doc._id);
			if (batch.length === batchSize) {
				subCommands.push(createSubCommand(batch));
				batch = [];
			}
		});
		if (batch.length > 0) {
			subCommands.push(createSubCommand(batch));
		}
		if (!subCommands.length) {
			return [];
		}
		return Executor.series(subCommands, { limiter });
	};
	return decorateCommand(command, model);
}

function ensureValidRoot(config /* RootConfig */) {
	if (isMongooseModel(config)) {
		return { model: config };
	}
	if (!isConfigObject(config)) {
		throw new DestroyerError('Invalid value for: `root` configuration');
	}
	const { model } = config;
	if (isMongooseModel(model)) {
		return config;
	}
	throw new DestroyerError('Invalid value for: `root.model`');
}

/**
 * @example
 * 	const destroyer = new Destroyer({
 * 		root: ScheduleModel,
 * 		children: [
 * 			ScheduleConstructionModel,
 * 			ScheduleModel,
 * 			ScheduleUmbrellaDataModel,
 * 			ScheduleUmbrellaModel,
 * 			{
 * 				model: ScheduleWellAssignmentModel,
 * 				parentKey: 'somethingElse', // parent ref key can be overriden for any individual child
 * 			},
 * 			{
 * 				destroyer: another.destroyer, // nested destroyers are supported
 * 			},
 * 		],
 * 		refKey: 'schedule',
 * 	});
 *
 * @class Destroyer
 * @param {MongooseModel} root - Main model
 * @param {(MongooseModel | DestroyerChild)[]} [children] - Models under the main model (optional)
 * @param {String} [refKey] - Key used in sub-models to reference the main model (optional)
 */
class Destroyer {
	constructor(config) {
		if (!(config && typeof config === 'object')) {
			throw new DestroyerError('Missing config object');
		}
		const { children = [], refKey = null, root } = config;
		this.root = ensureValidRoot(root);
		this.children = children.map((child) => new DestroyerChild(child, refKey));
	}

	destroy(_id, options = {}) {
		const { limiter = null } = options;
		const operations = this.children.reduce(
			(accumulator, child) => {
				const { batchSize, destroyer, model, parentRef } = child.config;
				if (destroyer) {
					accumulator.push(...destroyer.destroyAll({ [parentRef]: _id }, null, { limiter }).operations());
				} else {
					const childQuery = { [parentRef]: _id };
					const command = createBulkDelete(model, childQuery, batchSize, limiter);
					accumulator.push(command);
				}
				return accumulator;
			},
			[decorateCommand(() => this.root.model.deleteOne({ _id }), this.root.model)]
		);

		return new DestroyerTransaction(operations, limiter);
	}

	/** @param {any} childQuery */
	destroyAll(query, childQuery = null, options = {}) {
		const { limiter = null } = options;
		const useChildQuery = childQuery || query;
		const operations = this.children.reduce(
			(accumulator, child) => {
				const { batchSize, destroyer, model } = child.config;
				if (destroyer) {
					accumulator.push(...destroyer.destroyAll(useChildQuery, null, { limiter }).operations());
				} else {
					const command = createBulkDelete(model, useChildQuery, batchSize, limiter);
					accumulator.push(command);
				}
				return accumulator;
			},
			[createBulkDelete(this.root.model, query, this.root.batchSize, limiter)]
		);

		return new DestroyerTransaction(operations, limiter);
	}
}

module.exports = {
	Destroyer,
	DestroyerError, // exported only to be used from unit tests
};
