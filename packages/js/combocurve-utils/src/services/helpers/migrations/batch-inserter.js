// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { batchQuery, batchAggregation } = require('./batch-updater-v2');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Limiter, log } = require('../utilities');

const createBatchInsertFromQuery = ({
	bucketSize = 1,
	collection: collectionName,
	dispatchesPerSecond = 4,
	batchSize = 5000,
	query,
	selection = {},
	buildDocs,
}) => {
	const limiter = new Limiter({ bucketSize, dispatchesPerSecond });

	return async ({ db }) => {
		const collection = db.collection(collectionName);

		const total = await collection.countDocuments(query);
		log(`Query matching ${total} '${collectionName}'`);

		const batchCount = Math.ceil(total / batchSize);
		let totalInserted = 0;

		await batchQuery({ collection, query, selection, batchSize }, async (batch, batchIndex) => {
			log(`   Batch ${batchIndex + 1} / ${batchCount} ...`);

			const docs = buildDocs(batch);
			let insertedCount = 0;

			if (docs.length) {
				({ insertedCount } = await limiter.next(() => collection.insertMany(docs)));
			}

			totalInserted += insertedCount;

			log(`   Inserted: ${insertedCount}, Total Inserted: ${totalInserted} / ${total}`);
		});
	};
};

const createBatchInsertFromAggregation = ({
	bucketSize = 1,
	collection: collectionName,
	dispatchesPerSecond = 4,
	batchSize = 5000,
	pipeline,
	buildDocs,
}) => {
	const limiter = new Limiter({ bucketSize, dispatchesPerSecond });

	return async ({ db }) => {
		const collection = db.collection(collectionName);

		const [result] = await collection.aggregate([...pipeline, { $count: 'total' }]).toArray();
		const total = result ? result.total : 0;
		const batchCount = Math.ceil(total / batchSize);
		let totalInserted = 0;

		await batchAggregation({ batchSize, collection, pipeline }, async (batch, batchIndex) => {
			log(`   Batch ${batchIndex + 1} / ${batchCount} ...`);

			const docs = buildDocs(batch);
			let insertedCount = 0;

			if (docs.length) {
				({ insertedCount } = await limiter.next(() => collection.insertMany(docs)));
			}

			totalInserted += insertedCount;

			log(`   Inserted: ${insertedCount}, Total Inserted: ${totalInserted} / ${total * 2}`);
		});
	};
};

module.exports = { createBatchInsertFromQuery, createBatchInsertFromAggregation };
