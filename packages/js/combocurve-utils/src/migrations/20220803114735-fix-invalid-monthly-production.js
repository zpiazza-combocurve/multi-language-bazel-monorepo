// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Types } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const _ = require('lodash');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const { ObjectId } = Types;

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const BEGINNING_OF_TIME = new Date(1900, 0, 1);

const getIndexFromDate = (date) => Math.round((date - BEGINNING_OF_TIME) / ONE_DAY_IN_MS);
const getDateFromIndex = (index) => new Date(BEGINNING_OF_TIME.getTime() + index * ONE_DAY_IN_MS);

const YEARS = new Array(200).fill(0).map((__, i) => i + 1900);
const VALID_INDEXES = YEARS.map((y) => getIndexFromDate(new Date(y, 0, 1)));

const MONTHLY_PRODUCTION_FIELDS = [
	'oil',
	'gas',
	'water',
	'operational_tag',
	'choke',
	'days_on',
	'gasInjection',
	'waterInjection',
	'co2Injection',
	'steamInjection',
	'ngl',
	'customNumber0',
	'customNumber1',
	'customNumber2',
	'customNumber3',
	'customNumber4',
];

const mergeProdData = (primary, secondary) =>
	Object.fromEntries(
		MONTHLY_PRODUCTION_FIELDS.map((field) => [
			field,
			(primary[field] ?? new Array(12).fill(null)).map((v, i) => v ?? secondary[field]?.[i] ?? null),
		])
	);

const getIndexes = (data, startIndex) => {
	const year = getDateFromIndex(startIndex).getFullYear();
	const index = [...new Array(12).keys()].map((i) =>
		MONTHLY_PRODUCTION_FIELDS.some((f) => data[f][i] !== null) ? getIndexFromDate(new Date(year, i, 15)) : null
	);
	const firstProductionIndex = index.findIndex((i) => i !== null);
	return { startIndex, index, first_production_index: firstProductionIndex };
};

const mergeProdDocs = (incorrect, correct, well, startIndex) => {
	const correctToMerge =
		correct ?? Object.fromEntries(MONTHLY_PRODUCTION_FIELDS.map((field) => [field, new Array(12).fill(null)]));

	let primary;
	let secondary;
	if (!correctToMerge.updatedAt || correctToMerge.updatedAt < incorrect.updatedAt) {
		primary = incorrect;
		secondary = correctToMerge;
	} else {
		primary = correctToMerge;
		secondary = incorrect;
	}

	const mergedData = mergeProdData(primary, secondary);
	return { ...mergedData, ...getIndexes(mergedData, startIndex), well: well._id, project: well.project };
};

const getWellUpdates = async (db, wellId, productionData) => {
	const well = await db.collection('wells').findOne({ _id: wellId });

	if (!well) {
		return [];
	}

	const correctIndexesMap = Object.fromEntries(
		productionData.map((doc) => [
			doc.startIndex,
			getIndexFromDate(new Date(getDateFromIndex(doc.startIndex).getFullYear(), 0, 1)),
		])
	);

	const correctProdData = await db
		.collection('monthly-productions')
		.find({ well: wellId, startIndex: { $in: Object.values(correctIndexesMap) } })
		.toArray();

	const correctProdDataMap = _.groupBy(correctProdData, 'startIndex');

	return productionData
		.map((doc) => {
			const correctIndex = correctIndexesMap[doc.startIndex];
			const correct = correctProdDataMap[correctIndex]?.[0];
			const updates = [];
			if (correct) {
				updates.push({ deleteOne: { filter: { _id: correct._id } } });
			}
			updates.push({
				updateOne: {
					filter: { _id: doc._id },
					update: { $set: mergeProdDocs(doc, correct, well, correctIndex) },
				},
			});
			return updates;
		})
		.flat();
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: 'monthly-productions',
	batchSize: 1000,
	query: { startIndex: { $nin: VALID_INDEXES } },
	sort: { well: 1 },
	buildUpdates: async (batch, db) => {
		const prodByWell = _.groupBy(batch, 'well');
		const updatesByWell = await Promise.all(
			Object.entries(prodByWell).map(([wellId, monthlyProductions]) =>
				getWellUpdates(db, new ObjectId(wellId), monthlyProductions)
			)
		);
		return updatesByWell.flat();
	},
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
