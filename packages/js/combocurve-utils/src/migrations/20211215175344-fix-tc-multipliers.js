// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Types } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const _ = require('lodash');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate, createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const { ObjectId } = Types;

const getUpdate = async (typeCurveNormalization, db) => {
	const { steps, typeCurve, phase } = typeCurveNormalization;

	const multiplier = steps?.[0]?.multiplier;

	if (!(Number.isFinite(multiplier) && multiplier !== 1)) {
		return false;
	}

	const typeCurveNormalizationWells = await db
		.collection('type-curve-normalization-wells')
		.find({ typeCurve, phase })
		.toArray();

	return typeCurveNormalizationWells.map((typeCurveNormalizationWell) => ({
		updateOne: {
			filter: { _id: typeCurveNormalizationWell._id },
			update: {
				$set: {
					'multipliers.0': (typeCurveNormalizationWell?.multipliers?.[0] ?? 1) * multiplier,
				},
			},
		},
	}));
};

const buildUpdates = async (batch, db) => {
	const updates = await Promise.all(batch.map((doc) => getUpdate(doc, db)));

	return updates.flat().filter(Boolean);
};

const updateTypeCurveNormalizationWells = createBatchBulkUpdate({
	collection: 'type-curve-normalizations',
	selection: { _id: 1, steps: 1, phase: 1, typeCurve: 1 },
	batchSize: 500,
	query: { 'steps.0.multiplier': { $exists: true } },
	buildUpdates,
	toWriteCollection: 'type-curve-normalization-wells',
});

const getInserts = async (typeCurveNormalization, db, typeCurvesById) => {
	const { typeCurve, phase, steps } = typeCurveNormalization;

	const multiplier = steps?.[0]?.multiplier;

	if (!(Number.isFinite(multiplier) && multiplier !== 1)) {
		return false;
	}

	if (!typeCurvesById[typeCurve.toString()]) {
		return false;
	}

	const typeCurveNormalizationWells = await db
		.collection('type-curve-normalization-wells')
		.find({ typeCurve, phase })
		.toArray();

	const { wells } = typeCurvesById[typeCurve.toString()];

	const missing = _.difference(
		wells.map((well) => well.toString()),
		typeCurveNormalizationWells.map(({ well }) => well.toString())
	);

	return missing.map((wellId) => ({
		insertOne: {
			typeCurve,
			phase,
			well: new ObjectId(wellId),
			multipliers: [multiplier],
		},
	}));
};

const buildInserts = async (batch, db) => {
	const typeCurves = await db
		.collection('type-curves')
		.find({ _id: { $in: batch.map(({ typeCurve }) => typeCurve) } })
		.toArray();

	const typeCurvesById = _.keyBy(typeCurves, (typeCurve) => typeCurve._id.toString());

	const inserts = await Promise.all(batch.map((doc) => getInserts(doc, db, typeCurvesById)));

	return inserts.flat().filter(Boolean);
};

const createTypeCurveNormalizationWells = createBatchBulkUpdate({
	collection: 'type-curve-normalizations',
	selection: { _id: 1, steps: 1, phase: 1, typeCurve: 1 },
	batchSize: 500,
	query: { 'steps.0.multiplier': { $exists: true } },
	buildUpdates: buildInserts,
	toWriteCollection: 'type-curve-normalization-wells',
});

const deleteMultiplierField = createBatchUpdate({
	collection: 'type-curve-normalizations',
	query: { 'steps.0.multiplier': { $exists: true } },
	update: {
		$unset: {
			'steps.0.multiplier': '',
		},
	},
});

async function up({ db }) {
	await updateTypeCurveNormalizationWells({ db });
	try {
		await createTypeCurveNormalizationWells({ db });
	} finally {
		// Always delete
		await deleteMultiplierField({ db });
	}
}

module.exports = { up, uses: ['mongodb'] };
