// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const SCHEDULE_WELL_OUTPUTS_COLLECTION = 'schedule-well-outputs';

const DATE_IDX_LARGE = 109572; // 12/31/2199

const STEP_NAME = {
	PAD: 'Pad Preparation',
	SPUD: 'Spud',
	DRILLING: 'Drill',
	COMPLETION: 'Completion',
	FACILITY: 'Facility Construction',
};

const STEP_FIELDS = {
	'Pad Preparation': 'preparation',
	Spud: 'spud',
	Drill: 'drill',
	Completion: 'complete',
};

const DEFAULT_EMPTY_DATE = null;

const outputSteps = [STEP_NAME.PAD, STEP_NAME.SPUD, STEP_NAME.DRILLING, STEP_NAME.COMPLETION];
const outputActivities = ['Mob', 'Work', 'Demob'];

// UP FUNCTIONS
const getActivityStartEnd = (output, step, activity) => {
	const start = output[`${step}${activity}Start`];
	const end = output[`${step}${activity}End`];

	return {
		[activity.toLowerCase()]: {
			start: start || DEFAULT_EMPTY_DATE,
			end: end || DEFAULT_EMPTY_DATE,
		},
	};
};

const getEvents = (output, resources) => {
	if (output.events) return output.events;

	const resourceKeys = Object.keys(resources);

	return outputSteps
		.map((step, index) => {
			const stepField = STEP_FIELDS[step];

			const parsedActivities = outputActivities.reduce((acc, current) => {
				acc = { ...acc, ...getActivityStartEnd(output, stepField, current) };
				return acc;
			}, {});

			if (Object.keys(parsedActivities).length === 0) return false;

			const resourceName = output[`${stepField}ResourceName`];
			const resourceIdx = output[`${stepField}ResourceId`];

			return {
				activityStepIdx: index,
				activityStepName: step,
				resourceIdx: resourceIdx ? resourceKeys.indexOf(resourceIdx) : null,
				resourceName,
				...parsedActivities,
			};
		})
		.filter(Boolean);
};

const runUpdateWellOutputsUp = async (batch, db) => {
	const wellOutputsIds = batch.reduce((cum, { _id }) => [...cum, _id], []);

	const wellOutputs = await db
		.collection(SCHEDULE_WELL_OUTPUTS_COLLECTION)
		.find({ _id: { $in: wellOutputsIds }, output: { $exists: true } })
		.toArray();

	const resources = wellOutputs.reduce((acc, output) => {
		if (!acc[output.construction]) acc[output.construction] = {};

		outputSteps.forEach((step) => {
			const stepField = STEP_FIELDS[step];
			const resourceId = output.output[`${stepField}ResourceId`];
			const resourceName = output.output[`${stepField}ResourceName`];

			if (resourceId && resourceName) acc[output.construction][resourceId] = resourceName;
		});

		return acc;
	}, {});

	return wellOutputs.map((output) => {
		const events = getEvents(output.output, resources[output.construction]);
		const FPD = output.output.FPD;

		return {
			updateOne: {
				filter: { _id: output._id },
				update: {
					$set: {
						output: { events, FPD },
					},
				},
			},
		};
	});
};

const batchUpdateOutputUp = createBatchBulkUpdate({
	collection: SCHEDULE_WELL_OUTPUTS_COLLECTION,
	buildUpdates: runUpdateWellOutputsUp,
});

async function up({ db }) {
	await batchUpdateOutputUp({ db });
}

// DOWN FUNCTIONS
const getEventsDown = (output) => {
	if (!output.events) return output;

	let events = {};

	outputSteps.forEach((step) => {
		const stepField = STEP_FIELDS[step];
		const outputEvent = output.events.find((event) => event.activityStepName === step);

		const getValue = (value) => value || DEFAULT_EMPTY_DATE;

		if (!outputEvent)
			events = {
				...events,
				...{
					[`${stepField}MobStart`]: null,
					[`${stepField}MobEnd`]: null,
					[`${stepField}WorkStart`]: null,
					[`${stepField}WorkEnd`]: null,
					[`${stepField}DemobStart`]: null,
					[`${stepField}DemobEnd`]: null,
				},
			};
		else {
			const newEvent = {
				[`${stepField}MobStart`]: getValue(outputEvent.mob.start),
				[`${stepField}MobEnd`]: getValue(outputEvent.mob.end),
				[`${stepField}WorkStart`]: getValue(outputEvent.work.start),
				[`${stepField}WorkEnd`]: getValue(outputEvent.work.end),
				[`${stepField}DemobStart`]: getValue(outputEvent.demob.start),
				[`${stepField}DemobEnd`]: getValue(outputEvent.demob.end),
			};

			const resourceName = outputEvent.resourceName;
			const resourceId = outputEvent.resourceIdx;

			if (resourceName !== null && resourceId !== null) {
				newEvent[`${stepField}ResourceName`] = resourceName;
				newEvent[`${stepField}ResourceId`] = resourceId;
			}

			events = { ...events, ...newEvent };
		}
	});

	return events;
};

const runUpdateWellOutputsDown = async (batch, db) => {
	const wellOutputsIds = batch.reduce((cum, { _id }) => [...cum, _id], []);

	const wellOutputs = await db
		.collection(SCHEDULE_WELL_OUTPUTS_COLLECTION)
		.find({ _id: { $in: wellOutputsIds }, output: { $exists: true } })
		.toArray();

	return wellOutputs.map((output) => {
		const events = getEventsDown(output.output);
		const FPD = output.output.FPD;

		return {
			updateOne: {
				filter: { _id: output._id },
				update: {
					$set: {
						output: { ...events, FPD },
					},
				},
			},
		};
	});
};

const batchUpdateOutputDown = createBatchBulkUpdate({
	collection: SCHEDULE_WELL_OUTPUTS_COLLECTION,
	buildUpdates: runUpdateWellOutputsDown,
});

async function down({ db }) {
	await batchUpdateOutputDown({ db });
}

module.exports = { up, down, uses: ['mongodb'], DATE_IDX_LARGE };
