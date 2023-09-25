// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const PROJECTS_COLLECTION = 'projects';
const SCHEDULES_COLLECTION = 'schedules';
const WELLS_COLLECTION = 'wells';

const WELL_IDENTIFIERS = ['project', 'dataSource', 'chosenID'];

const RELEASE_DATE = new Date('2023-07-17T18:24:36.047Z');
const BUGFIX_DATE = new Date('2023-08-01T15:00:00.007Z');

const getUniqueWellIdentifier = (well) => {
	const wellIdentifiersValues = WELL_IDENTIFIERS.map((identifier) => well?.[identifier]);
	return wellIdentifiersValues.filter(Boolean).join('-');
};

const runUpdatesUp = async (projects, db) => {
	const schedules = await db
		.collection(SCHEDULES_COLLECTION)
		.find({
			project: { $in: projects.map((project) => project._id) },
		})
		.toArray();
	const scheduleWellIds = schedules
		.map((schedule) => {
			return schedule.inputData.map((input) => input.well);
		})
		.flat();
	const projectWellIds = projects.map((project) => project.wells).flat();

	const wells = await db
		.collection(WELLS_COLLECTION)
		.find({
			_id: { $in: [...projectWellIds, ...scheduleWellIds] },
		})
		.project({ _id: 1, ...WELL_IDENTIFIERS.reduce((acc, identifier) => ({ ...acc, [identifier]: 1 }), {}) })
		.toArray();

	const wellIdToWellMap = wells.reduce((acc, well) => {
		acc[well._id.toString()] = well;
		return acc;
	}, {});

	const projectIdToProjectMap = projects.reduce((acc, project) => {
		acc[project._id.toString()] = project;
		return acc;
	}, {});

	return schedules.map((schedule) => {
		const scheduleWellIds = schedule.inputData.map((input) => input.well);

		const project = projectIdToProjectMap[schedule.project.toString()];

		// wellIdToIdentifierMap:
		// Maps the wellId from the broken scheduler that is referencing the copiedFrom project
		// 		to their unique identifier
		const wellIdToIdentifierMap = scheduleWellIds.reduce((acc, wellId) => {
			const wellData = wellIdToWellMap[wellId.toString()];
			// now that we are using project as a key, we need to use the same project
			// for the copied well and original in order to map both
			const wellIdentifier = getUniqueWellIdentifier({ ...wellData, project: project._id.toString() });

			if (wellIdentifier) acc[wellId] = wellIdentifier;

			return acc;
		}, {});

		// identifierToWellIdMap:
		// Maps the unique identifier
		// 		to the well id from the copied project that should be the reference
		const identifierToWellIdMap = project.wells.reduce((acc, wellId) => {
			const wellData = wellIdToWellMap[wellId.toString()];
			const wellIdentifier = getUniqueWellIdentifier({ ...wellData, project: project._id.toString() });

			if (wellIdentifier) acc[wellIdentifier] = wellId;

			return acc;
		}, {});

		const inputData = schedule.inputData.map((input) => {
			const well = input.well;
			const identifierValue = wellIdToIdentifierMap[well] || well;
			const newWellId = identifierToWellIdMap[identifierValue] || well;

			return {
				...input,
				well: newWellId,
			};
		});

		return {
			updateOne: {
				filter: { _id: schedule._id },
				update: {
					$set: {
						inputData,
					},
				},
			},
		};
	});
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: PROJECTS_COLLECTION,
	toWriteCollection: SCHEDULES_COLLECTION,
	buildUpdates: runUpdatesUp,
	query: { createdAt: { $gt: RELEASE_DATE, $lt: BUGFIX_DATE }, copiedFrom: { $exists: true } },
	selection: { _id: 1, wells: 1 },
	batchSize: 1,
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

const runUpdatesDown = async (projects, db) => {
	const schedules = await db
		.collection(SCHEDULES_COLLECTION)
		.find({
			project: { $in: projects.map((project) => project._id) },
		})
		.toArray();
	const scheduleWellIds = schedules
		.map((schedule) => {
			return schedule.inputData.map((input) => input.well);
		})
		.flat();

	const originalProjects = await db
		.collection(PROJECTS_COLLECTION)
		.find({
			_id: { $in: projects.map((project) => project.copiedFrom) },
		})
		.toArray();
	const originalProjectWellIds = originalProjects.map((project) => project.wells).flat();

	const wells = await db
		.collection(WELLS_COLLECTION)
		.find({
			_id: { $in: [...originalProjectWellIds, ...scheduleWellIds] },
		})
		.project({ _id: 1, ...WELL_IDENTIFIERS.reduce((acc, identifier) => ({ ...acc, [identifier]: 1 }), {}) })
		.toArray();

	const wellIdToWellMap = wells.reduce((acc, well) => {
		acc[well._id.toString()] = well;
		return acc;
	}, {});

	const projectIdToProjectMap = projects.reduce((acc, project) => {
		acc[project._id.toString()] = project;
		return acc;
	}, {});

	const originalProjectIdToProjectMap = originalProjects.reduce((acc, project) => {
		acc[project._id.toString()] = project;
		return acc;
	}, {});

	return schedules.map((schedule) => {
		const scheduleWellIds = schedule.inputData.map((input) => input.well);

		// wellIdToIdentifierMap:
		// Maps the correct wellId from the schedule
		// 		to their unique identifier
		const wellIdToIdentifierMap = scheduleWellIds.reduce((acc, wellId) => {
			const wellData = wellIdToWellMap[wellId.toString()];
			const project = projectIdToProjectMap[schedule.project.toString()];
			const wellIdentifier = getUniqueWellIdentifier({ ...wellData, project: project.copiedFrom });

			if (wellIdentifier) acc[wellId] = wellIdentifier;

			return acc;
		}, {});

		// identifierToWellIdMap:
		// Maps the unique identifier
		// 		to the well id from the original project (copiedFrom)
		// 	In that case, the well id will be broken. In a state where it will not be on the new project.
		const project = projectIdToProjectMap[schedule.project.toString()];
		const originalProject = originalProjectIdToProjectMap[project.copiedFrom.toString()];

		const identifierToWellIdMap = originalProject.wells.reduce((acc, wellId) => {
			const wellData = wellIdToWellMap[wellId.toString()];
			const wellIdentifier = getUniqueWellIdentifier({ ...wellData, project: project.copiedFrom });

			if (wellIdentifier) acc[wellIdentifier] = wellId;

			return acc;
		}, {});

		const inputData = schedule.inputData.map((input) => {
			const well = input.well;
			const identifierValue = wellIdToIdentifierMap[well] || well;
			const newWellId = identifierToWellIdMap[identifierValue] || well;

			return {
				...input,
				well: newWellId,
			};
		});

		return {
			updateOne: {
				filter: { _id: schedule._id },
				update: {
					$set: {
						inputData,
					},
				},
			},
		};
	});
};

const batchUpdateDown = createBatchBulkUpdate({
	collection: PROJECTS_COLLECTION,
	toWriteCollection: SCHEDULES_COLLECTION,
	buildUpdates: runUpdatesDown,
	query: { createdAt: { $gt: RELEASE_DATE, $lt: BUGFIX_DATE }, copiedFrom: { $exists: true } },
	selection: { _id: 1, wells: 1, copiedFrom: 1 },
	batchSize: 1,
});

async function down({ db }) {
	await batchUpdateDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
