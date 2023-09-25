// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchDelete } = require('../services/helpers/migrations/batch-deleter');
const {
	createBatchUpdateFromAggregation,
	createBatchBulkUpdate,
	createBatchUpdate,
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
} = require('../services/helpers/migrations/batch-updater-v2');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ignoreCollectionNotFound, ignoreNamespaceExists } = require('../services/helpers/mongo');

const V1_QUALIFIER = 'status';

const scheduleUmbrellasPipeline = [
	{
		$lookup: {
			from: 'schedule-umbrella-datas',
			localField: '_id',
			foreignField: 'umbrella',
			as: 'umbrellaData',
		},
	},
	{ $unwind: { path: '$umbrellaData', preserveNullAndEmptyArrays: true } },
	{
		$group: {
			_id: '$_id',
			inputField: { $first: '$column' },
			qualifierAssignments: {
				$push: {
					$cond: [
						'$umbrellaData',
						{ well: '$umbrellaData.well', value: '$umbrellaData.value.status' },
						'$$REMOVE',
					],
				},
			},
		},
	},
];

const buildUmbrellasUpdates = (batch) =>
	batch.map((doc) => {
		const { _id, ...updates } = doc;
		return {
			updateOne: {
				filter: { _id },
				update: {
					$set: updates,
					$unset: { column: '' },
				},
			},
		};
	});

const batchUpdateUmbrellasUp = createBatchUpdateFromAggregation({
	collection: 'schedule-umbrellas',
	pipeline: scheduleUmbrellasPipeline,
	buildUpdates: buildUmbrellasUpdates,
});

const schedulesPipeline = [
	{ $match: { assignments: { $exists: true } } },
	{
		$set: {
			activeUmbrella: { $toObjectId: '$activeUmbrellas.status' },
		},
	},
	{
		$lookup: {
			from: 'schedule-umbrellas',
			localField: 'activeUmbrella',
			foreignField: '_id',
			as: 'activeUmbrella',
		},
	},
	{ $unwind: { path: '$activeUmbrella', preserveNullAndEmptyArrays: true } },
	{ $unwind: { path: '$assignments', preserveNullAndEmptyArrays: true } },
	{
		$lookup: {
			from: 'schedule-well-assignments',
			localField: 'assignments',
			foreignField: '_id',
			as: 'assignmentData',
		},
	},
	{ $unwind: { path: '$assignmentData', preserveNullAndEmptyArrays: true } },
	{
		$group: {
			_id: '$_id',
			inputData: {
				$push: {
					$cond: [
						'$assignmentData',
						{
							well: '$assignmentData.well',
							priority: '$assignmentData.order',
							status: '$assignmentData.values.status',
						},
						'$$REMOVE',
					],
				},
			},
			qualifiers: {
				$addToSet: {
					$cond: [
						'$activeUmbrella',
						{
							inputField: '$activeUmbrella.inputField',
							qualifier: '$activeUmbrella._id',
							qualifierName: '$activeUmbrella.name',
						},
						'$$REMOVE',
					],
				},
			},
		},
	},
];

const buildScheduleUpdates = (batch) =>
	batch.map((doc) => {
		const { _id, ...updates } = doc;
		return {
			updateOne: {
				filter: { _id },
				update: {
					$set: updates,
					$unset: { assignments: '', activeUmbrellas: '' },
				},
			},
		};
	});

const batchUpdateSchedulesUp = createBatchUpdateFromAggregation({
	collection: 'schedules',
	pipeline: schedulesPipeline,
	buildUpdates: buildScheduleUpdates,
});

async function up({ db }) {
	await batchUpdateUmbrellasUp({ db });
	await batchUpdateSchedulesUp({ db });

	const collections = await db.listCollections().toArray();

	const collectionExists = collections.find((collection) => collection.name === 'schedule-umbrellas');

	if (collectionExists) {
		await ignoreCollectionNotFound(async () =>
			db.collection('schedule-umbrellas').rename('schedule-input-qualifiers', { dropTarget: true })
		);
	}

	await ignoreCollectionNotFound(async () => db.collection('schedule-well-assignments').drop());
	await ignoreCollectionNotFound(async () => db.collection('schedule-umbrella-datas').drop());
}

const scheduleInputQuery = {
	'inputData.0': { $exists: true },
};

const inputDataSelection = {
	projection: {
		project: 1,
		inputData: 1,
	},
};

const buildAssignmentDatasUpdates = (batch) =>
	batch.reduce((assignmentUpdates, doc) => {
		const { inputData, project, _id: schedule } = doc;

		inputData.forEach((assignment) => {
			const well = assignment.well;
			const order = assignment?.priority;

			assignmentUpdates.push({
				insertOne: {
					well,
					schedule,
					project,
					values: { status: assignment.status },
					...(order && { order }),
					__v: 0,
				},
			});
		});

		return assignmentUpdates;
	}, []);

const batchAssignmentDatasDown = createBatchBulkUpdate({
	collection: 'schedules',
	selection: inputDataSelection,
	query: scheduleInputQuery,
	buildUpdates: buildAssignmentDatasUpdates,
	toWriteCollection: 'schedule-well-assignments',
});

const qualifierDataQuery = {
	inputField: V1_QUALIFIER,
	'qualifierAssignments.0': { $exists: true },
};

const qualifierDataSelection = {
	projection: {
		qualifierAssignments: 1,
		project: 1,
		schedule: 1,
		inputField: 1,
	},
};

const buildUmbrellaDatasUpdates = async (batch, db) => {
	const wellSchedules = Array.from(
		batch.reduce((wellSchedules, doc) => {
			doc.qualifierAssignments.forEach((assignments) => {
				wellSchedules.add({ schedule: doc.schedule, well: assignments.well });
			});
			return wellSchedules;
		}, new Set())
	);

	const cursor = db
		.collection('schedule-well-assignments')
		.find({ $or: wellSchedules }, { projection: { _id: 1, well: 1, schedule: 1 } });

	let assignmentIds = {};
	for await (const doc of cursor) {
		const schedule = doc.schedule;
		assignmentIds = {
			...assignmentIds,
			[schedule]: { ...assignmentIds?.[schedule], [doc.well]: doc._id },
		};
	}

	return batch.reduce((updates, doc) => {
		const { qualifierAssignments, project, schedule, inputField: column, _id: umbrella } = doc;
		qualifierAssignments.forEach((assignment) => {
			const well = assignment.well;
			const assignmentId = assignmentIds?.[schedule]?.[well];
			if (assignment) {
				updates.push({
					insertOne: {
						project,
						schedule,
						well,
						column,
						umbrella,
						assignment: assignmentId,
						value: { status: assignment.value },
						__v: 0,
					},
				});
			}
		});
		return updates;
	}, []);
};

const batchUmbrellasDatasDown = createBatchBulkUpdate({
	collection: 'schedule-input-qualifiers',
	selection: qualifierDataSelection,
	query: qualifierDataQuery,
	buildUpdates: buildUmbrellaDatasUpdates,
	toWriteCollection: 'schedule-umbrella-datas',
});

const batchUmbrellasDown = createBatchUpdate({
	collection: 'schedule-input-qualifiers',
	query: { inputField: V1_QUALIFIER },
	update: {
		$set: { column: V1_QUALIFIER },
		$unset: { inputField: '', qualifierAssignments: '' },
	},
});

const batchRemoveUnsupportedUmbrellas = createBatchDelete({
	collection: 'schedule-input-qualifiers',
	query: { inputField: { $exists: true, $ne: V1_QUALIFIER } },
});

const schedulesDownPipeline = [
	{ $match: { qualifiers: { $exists: true } } },
	{
		$lookup: {
			from: 'schedule-well-assignments',
			localField: '_id',
			foreignField: 'schedule',
			as: 'wellAssignments',
		},
	},
	{ $unwind: { path: '$wellAssignments', preserveNullAndEmptyArrays: true } },
	{ $unwind: { path: '$qualifiers', preserveNullAndEmptyArrays: true } },
	{
		$group: {
			_id: '$_id',
			assignments: {
				$push: '$wellAssignments._id',
			},
			activeUmbrellas: {
				$mergeObjects: {
					status: {
						$cond: [
							{ $eq: ['$qualifiers.inputField', 'status'] },
							{ $toString: '$qualifiers.qualifier' },
							'$$REMOVE',
						],
					},
				},
			},
		},
	},
	{
		$set: {
			activeUmbrellas: {
				$cond: [{ $ne: ['$activeUmbrellas', {}] }, '$activeUmbrellas', '$$REMOVE'],
			},
		},
	},
];

const buildScheduleDownUpdates = (batch) =>
	batch.map((doc) => {
		const { _id, ...updates } = doc;
		return {
			updateOne: {
				filter: { _id },
				update: {
					$set: updates,
					$unset: { inputData: '', qualifiers: '' },
				},
			},
		};
	});

const batchUpdateSchedulesDown = createBatchUpdateFromAggregation({
	collection: 'schedules',
	pipeline: schedulesDownPipeline,
	buildUpdates: buildScheduleDownUpdates,
});

async function down({ db }) {
	await ignoreNamespaceExists(async () => db.createCollection('schedule-well-assignments'));
	await ignoreNamespaceExists(async () => db.createCollection('schedule-umbrella-datas'));

	await batchAssignmentDatasDown({ db });
	await batchUmbrellasDatasDown({ db });
	await batchUmbrellasDown({ db });
	await batchRemoveUnsupportedUmbrellas({ db });
	await batchUpdateSchedulesDown({ db });

	await ignoreCollectionNotFound(async () => db.collection('schedule-input-qualifiers').rename('schedule-umbrellas'));
}

module.exports = { up, down, uses: ['mongodb'] };
