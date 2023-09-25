// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Limiter, log } = require('../utilities');

const iterate = async (cursor, batchSize, iterator) => {
	let batch = [];
	let batchIndex = 0;

	// eslint-disable-next-line no-await-in-loop
	while (await cursor.hasNext()) {
		// eslint-disable-next-line no-await-in-loop
		const doc = await cursor.next();

		batch.push(doc);
		if (batch.length === batchSize) {
			// eslint-disable-next-line no-await-in-loop
			await iterator(batch, batchIndex++);
			batch = [];
		}
	}

	if (batch.length > 0) {
		// eslint-disable-next-line no-await-in-loop
		await iterator(batch, batchIndex++);
	}
};

const batchQuery = async ({ batchSize, collection, query, selection, sort = { _id: 1 } }, iterator) => {
	const cursor = collection.find(query, selection).sort(sort).batchSize(batchSize);
	await iterate(cursor, batchSize, iterator);
};

const batchAggregation = async ({ batchSize, collection, pipeline }, iterator) => {
	const cursor = collection.aggregate(pipeline);
	await iterate(cursor, batchSize, iterator);
};

const createBatchUpdate = ({
	bucketSize = 1,
	collection: collectionName,
	dispatchesPerSecond = 4,
	batchSize = 5000,
	query,
	sort,
	update,
	options,
}) => {
	const limiter = new Limiter({ bucketSize, dispatchesPerSecond });

	return async ({ db }) => {
		const collection = db.collection(collectionName);

		const total = await collection.countDocuments(query);
		log(`Query matching ${total} '${collectionName}'`);

		const batchCount = Math.ceil(total / batchSize);
		let totalModified = 0;

		await batchQuery({ collection, query, selection: { _id: 1 }, batchSize, sort }, async (batch, batchIndex) => {
			log(`   Batch ${batchIndex + 1} / ${batchCount} ...`);

			const ids = batch.map(({ _id }) => _id);

			const { modifiedCount } = await limiter.next(() =>
				collection.updateMany({ ...query, _id: { $in: ids } }, update, options)
			);

			totalModified += modifiedCount;

			log(`   Modified: ${modifiedCount}, Total Modified: ${totalModified} / ${total}`);
		});
	};
};

const createBatchBulkUpdate = ({
	bucketSize = 1,
	collection: collectionName,
	dispatchesPerSecond = 4,
	batchSize = 5000,
	selection = {},
	query,
	buildUpdates,
	toWriteCollection = collectionName,
}) => {
	const limiter = new Limiter({ bucketSize, dispatchesPerSecond });

	return async ({ db }) => {
		const collectionOnRead = db.collection(collectionName);
		const collectionOnWriting = db.collection(toWriteCollection);

		const total = await collectionOnRead.countDocuments(query);
		log(`Query matching ${total} '${collectionName}'`);

		const batchCount = Math.ceil(total / batchSize);
		let totalModified = 0;

		await batchQuery({ collection: collectionOnRead, query, selection, batchSize }, async (batch, batchIndex) => {
			log(`   Batch ${batchIndex + 1} / ${batchCount} ...`);

			const updates = await buildUpdates(batch, db);

			let modifiedCount = 0;

			if (updates.length) {
				({ modifiedCount } = await limiter.next(() => collectionOnWriting.bulkWrite(updates)));
			}

			totalModified += modifiedCount;

			log(`   Modified: ${modifiedCount}, Total Modified: ${totalModified} / ${total}`);
		});
	};
};

const createBatchUpdateFromAggregation = ({
	collection: collectionName,
	pipeline,
	buildUpdates,
	batchSize = 5000,
	bucketSize = 1,
	dispatchesPerSecond = 4,
}) => {
	const limiter = new Limiter({ bucketSize, dispatchesPerSecond });

	return async ({ db }) => {
		const collection = db.collection(collectionName);

		const [result] = await collection.aggregate([...pipeline, { $count: 'total' }]).toArray();
		const total = result ? result.total : 0;

		const batchCount = Math.ceil(total / batchSize);
		let totalModified = 0;

		log(`Query matching ${total} '${collectionName}'`);
		await batchAggregation({ batchSize, collection, pipeline }, async (batch, batchIndex) => {
			log(`   Batch ${batchIndex + 1} / ${batchCount} ...`);

			const updates = buildUpdates(batch);

			let modifiedCount = 0;

			if (updates.length) {
				({ modifiedCount } = await limiter.next(() => collection.bulkWrite(updates)));
			}

			totalModified += modifiedCount;

			log(`   Modified: ${modifiedCount}, Total Modified: ${totalModified} / ${total}`);
		});
	};
};

module.exports = {
	batchQuery,
	batchAggregation,
	createBatchUpdate,
	createBatchUpdateFromAggregation,
	createBatchBulkUpdate,
};
