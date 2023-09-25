// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('bson');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const SCHEDULE_SETTINGS_COLLECTION = 'schedule-settings';
const PRIMARY_RIGS_COLLECTION = 'schedule-setting-primary-rigs';
const SPUD_RIGS_COLLECTION = 'schedule-setting-spud-rigs';
const COMPLETION_CREWS_COLLECTION = 'schedule-setting-completion-crews';

const DATE_IDX_LARGE = 109572; // 12/31/2199

const STEP_NAME = {
	PAD: 'Pad Preparation',
	SPUD: 'Spud',
	DRILLING: 'Drill',
	COMPLETION: 'Completion',
	FACILITY: 'Facility Construction',
};

const PAD_OPERATION_OPTIONS = {
	BATCH: 'batch',
	DISABLED: 'disabled',
	PARALLEL: 'parallel',
	SEQUENCE: 'sequence',
};

// UP FUNCTIONS
const getStepDuration = (resources) => {
	const durationSum = resources.reduce((accumulator, current) => {
		return accumulator + current.workingDays[0].value;
	}, 0);

	return durationSum ? Math.ceil(durationSum / resources.length) : 0;
};

const getPadOperation = (pad, batch) => {
	/*
		Returns a padOperation based on pad enabled and batch
		enabled     batch         padOperation
		true        false         sequence
		false       true          disabled
		true        true          batch
		false       false         disabled
	*/
	const padOperations = {
		true: {
			false: PAD_OPERATION_OPTIONS.SEQUENCE,
			true: PAD_OPERATION_OPTIONS.BATCH,
		},
		false: {
			false: PAD_OPERATION_OPTIONS.DISABLED,
			true: PAD_OPERATION_OPTIONS.DISABLED,
		},
	};

	return padOperations[pad][batch];
};

const parseStep = ({ name, padOperation, stepDuration, requiresResources }) => {
	if (stepDuration)
		return {
			name,
			padOperation,
			stepDuration: { days: stepDuration, useLookup: false },
			requiresResources,
		};

	return false;
};

const getActivitySteps = ({ settings, spudRigs, primaryRigs, completionCrews }) => {
	if (settings && settings.activitySteps) return settings.activitySteps;

	const general = settings.general;
	const { padPreparationDays, padPreparationCrewCount, facilityDays } = general;

	const padPreparationStep = parseStep({
		name: STEP_NAME.PAD,
		padOperation: PAD_OPERATION_OPTIONS.PARALLEL,
		stepDuration: padPreparationDays,
		requiresResources: padPreparationCrewCount > 0,
	});

	const spudStep = parseStep({
		name: STEP_NAME.SPUD,
		padOperation: PAD_OPERATION_OPTIONS.DISABLED,
		stepDuration: getStepDuration(spudRigs),
		requiresResources: true,
	});

	const drillingStep = parseStep({
		name: STEP_NAME.DRILLING,
		padOperation: getPadOperation(general.padDrilling.enabled, general.padDrilling.batch),
		stepDuration: getStepDuration(primaryRigs),
		requiresResources: true,
	});

	const completionStep = parseStep({
		name: STEP_NAME.COMPLETION,
		padOperation: getPadOperation(general.padCompletion.enabled, general.padCompletion.batch),
		stepDuration: getStepDuration(completionCrews),
		requiresResources: true,
	});

	const facilityStep = parseStep({
		name: STEP_NAME.FACILITY,
		padOperation: PAD_OPERATION_OPTIONS.PARALLEL,
		stepDuration: facilityDays,
		requiresResources: false,
	});

	const activitySteps = [padPreparationStep, spudStep, drillingStep, completionStep, facilityStep].filter(Boolean);

	return activitySteps.map((step, stepIdx) => {
		const previousStepIdx = stepIdx - 1 >= 0 ? [stepIdx - 1] : [];
		return { ...step, stepIdx, previousStepIdx };
	});
};

const parseResources = (resources, stepIdx) => {
	return resources
		.map((resource) => {
			const {
				active,
				availability: availabilities,
				demobilizationDays,
				mobilizationDays,
				workOnHolidays,
				name,
			} = resource;

			return availabilities
				.map((availability, index) => {
					const { start, end } = availability;
					return {
						stepIdx,
						active,
						availability: { start, end },
						demobilizationDays,
						mobilizationDays,
						workOnHolidays,
						name: name + (availabilities.length > 1 ? ` - ${index + 1}` : ''),
					};
				})
				.flat();
		})
		.flat();
};

const getResources = ({ settings, activitySteps, spudRigs, primaryRigs, completionCrews }) => {
	if (settings && settings.resources) return settings.resources;

	const {
		general: { padPreparationCrewCount },
	} = settings;

	const padPreparationStep = activitySteps.find((step) => step.name === STEP_NAME.PAD);
	const drillingStep = activitySteps.find((step) => step.name === STEP_NAME.DRILLING);
	const completionStep = activitySteps.find((step) => step.name === STEP_NAME.COMPLETION);
	const spudStep = activitySteps.find((step) => step.name === STEP_NAME.SPUD);

	const padPreparationCrews = [];
	const stepIdx = padPreparationStep ? [activitySteps.indexOf(padPreparationStep)] : [];
	for (let i = 1; i <= padPreparationCrewCount; i++) {
		padPreparationCrews.push({
			stepIdx,
			active: Boolean(padPreparationStep),
			availability: { start: 1, end: DATE_IDX_LARGE },
			demobilizationDays: 0,
			mobilizationDays: 0,
			workOnHolidays: true,
			name: `Pad Preparation Crew ${i}`,
		});
	}

	const newPrimaryRigs = parseResources(primaryRigs, [activitySteps.indexOf(drillingStep)]);
	const newSpudRigs = parseResources(spudRigs, [activitySteps.indexOf(spudStep)]);
	const newCompletionCrews = parseResources(completionCrews, [activitySteps.indexOf(completionStep)]);

	return [...padPreparationCrews, ...newPrimaryRigs, ...newSpudRigs, ...newCompletionCrews];
};

const getStartProgram = ({ general, settings }) => {
	if (general) return general.startProgram;
	return settings.startProgram;
};

const runUpdatesUp = async (batch, db) => {
	const scheduleSettingsIds = batch.reduce((cum, { _id }) => [...cum, _id], []);

	const scheduleSettings = await db
		.collection(SCHEDULE_SETTINGS_COLLECTION)
		.find({ _id: { $in: scheduleSettingsIds } })
		.toArray();

	const primaryRigs = await db
		.collection(PRIMARY_RIGS_COLLECTION)
		.find({ scheduleSetting: { $in: scheduleSettingsIds } })
		.toArray();
	const spudRigs = await db
		.collection(SPUD_RIGS_COLLECTION)
		.find({ scheduleSetting: { $in: scheduleSettingsIds } })
		.toArray();
	const completionCrews = await db
		.collection(COMPLETION_CREWS_COLLECTION)
		.find({ scheduleSetting: { $in: scheduleSettingsIds } })
		.toArray();

	return scheduleSettings.map((settings) => {
		const filterResources = (resource) => {
			return resource.scheduleSetting.toString() === settings._id.toString();
		};

		const general = settings.general;
		const settingsPrimaryRigs = primaryRigs.filter(filterResources);
		const settingsSpudRigs = spudRigs.filter(filterResources);
		const settingsCompletionCrews = completionCrews.filter(filterResources);
		const startProgram = getStartProgram({ general, settings });
		const activitySteps = getActivitySteps({
			settings,
			spudRigs: settingsSpudRigs,
			primaryRigs: settingsPrimaryRigs,
			completionCrews: settingsCompletionCrews,
		});
		const resources = getResources({
			settings,
			activitySteps,
			spudRigs: settingsSpudRigs,
			primaryRigs: settingsPrimaryRigs,
			completionCrews: settingsCompletionCrews,
		});

		return {
			updateOne: {
				filter: { _id: settings._id },
				update: {
					$set: {
						resources,
						activitySteps,
						startProgram,
					},
					$unset: {
						primaryRigs: '',
						spudRigs: '',
						completionCrews: '',
						wellPreference: '',
						general: '',
					},
				},
			},
		};
	});
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: SCHEDULE_SETTINGS_COLLECTION,
	buildUpdates: runUpdatesUp,
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

// DOWN FUNCTIONS
const mapNewResourcesToOldOne = (resource, settings) => {
	const { active, availability, demobilizationDays, mobilizationDays, workOnHolidays, name, stepIdx } = resource;
	const step = settings.activitySteps[stepIdx];
	const lowestAvailabilityStartDay = availability.reduce((accumulator, current) => {
		if (current.start < accumulator) accumulator = current.start;
		return accumulator;
	}, Infinity);

	const DAYS_IN_YEAR = 365.25;
	const yearsToIndex = (years) => Math.round(years * DAYS_IN_YEAR);

	return {
		active,
		availability,
		demobilizationDays,
		mobilizationDays,
		workingDays: [
			{
				start: lowestAvailabilityStartDay,
				end: lowestAvailabilityStartDay + yearsToIndex(50), // from main-cc
				value: step.stepDuration.days,
			},
		],
		workOnHolidays,
		name,
		project: settings.project,
		scheduleSetting: settings._id,
		extendToFinish: true,
		locations: [],
	};
};

const getNewResources = (settings, collection) => {
	if (settings.primaryRigs && settings.spudRigs && settings.completionCrews) {
		const resources = {
			[PRIMARY_RIGS_COLLECTION]: settings.primaryRigs,
			[SPUD_RIGS_COLLECTION]: settings.spudRigs,
			[COMPLETION_CREWS_COLLECTION]: settings.completionCrews,
		};
		return resources[collection];
	}

	const RESOURCE_NAME = {
		[PRIMARY_RIGS_COLLECTION]: 'Primary Rig',
		[SPUD_RIGS_COLLECTION]: 'Spud Rig',
		[COMPLETION_CREWS_COLLECTION]: 'Completion Crew',
	};

	const collectionResources = settings.resources.filter((resource) =>
		resource.name.includes(RESOURCE_NAME[collection])
	);
	const mergedAvailabilities = collectionResources.reduce((accumulator, current) => {
		const originalCurrentName = current.name.replace(/ - [0-9]+$/, '');
		const item = accumulator.find(
			(item) => item._id === current._id && item.name.replace(/ - [0-9]+$/, '') === originalCurrentName
		);

		if (item) {
			item.availability.push(current.availability);
		} else
			accumulator.push({
				...current,
				availability: [current.availability],
				name: originalCurrentName,
			});

		return accumulator;
	}, []);
	const resources = mergedAvailabilities.map((resource) => mapNewResourcesToOldOne(resource, settings));

	return resources;
};

const runInsertResourcesDown = (collection) => async (batch, db) => {
	const scheduleSettingsIds = batch.reduce((cum, { _id }) => [...cum, _id], []);

	const resourcesCollection = await db
		.collection(collection)
		.find({ scheduleSetting: { $in: scheduleSettingsIds } })
		.toArray();

	return batch
		.map((settings) => {
			const filterResources = (resource) => {
				return resource.scheduleSetting.toString() === settings._id.toString();
			};

			const resourcesFromSettings = resourcesCollection.filter(filterResources);
			const noResources = resourcesFromSettings.length === 0;

			if (noResources) {
				const resources = getNewResources(settings, collection);
				if (resources.length) {
					return { insertMany: resources };
				}
			}

			return false;
		})
		.filter(Boolean);
};

const batchInsertRigsDown = (COLLECTION) =>
	createBatchBulkUpdate({
		collection: SCHEDULE_SETTINGS_COLLECTION,
		toWriteCollection: COLLECTION,
		buildUpdates: runInsertResourcesDown(COLLECTION),
	});

const getPadAndBatch = (padOperation) => {
	const padAndBatch = {
		sequence: [true, false],
		batch: [true, true],
		disabled: [false, false],
	};

	return padAndBatch[padOperation];
};

const getGeneral = (settings) => {
	if (settings && settings.general) return settings.general;

	const padPreparationStep = settings.activitySteps.find((step) => step.name === STEP_NAME.PAD);
	const drillingSteps = settings.activitySteps.filter((step) => step.name === STEP_NAME.DRILLING);
	const completionSteps = settings.activitySteps.filter((step) => step.name === STEP_NAME.COMPLETION);
	const facilityStep = settings.activitySteps.find((step) => step.name === STEP_NAME.FACILITY);

	const [drillingEnabled, drillingBatch] = getPadAndBatch(drillingSteps[0].padOperation);
	const [completionEnabled, completionBatch] = getPadAndBatch(completionSteps[0].padOperation);

	const padPreparationCrews = settings.resources.filter((resource) => resource.name.includes('Pad Preparation Crew'));

	return {
		startProgram: settings.startProgram,
		facilityDays: facilityStep.stepDuration.days,
		padPreparationDays: padPreparationStep ? padPreparationStep.stepDuration.days : 0,
		padPreparationCrewCount: padPreparationCrews.length,
		padDrilling: {
			enabled: drillingEnabled,
			batch: drillingBatch,
		},
		padCompletion: {
			enabled: completionEnabled,
			batch: completionBatch,
		},
		maxDUC: null,
		applyWellPreference: 'drill',
	};
};

const mapId = (items) => items.map((item) => new ObjectId(item._id));

const runUpdatesDown = async (batch, db) => {
	const scheduleSettingsIds = batch.reduce((cum, { _id }) => [...cum, _id], []);

	const primaryRigs = await db
		.collection(PRIMARY_RIGS_COLLECTION)
		.find({ scheduleSetting: { $in: scheduleSettingsIds } })
		.toArray();
	const spudRigs = await db
		.collection(SPUD_RIGS_COLLECTION)
		.find({ scheduleSetting: { $in: scheduleSettingsIds } })
		.toArray();
	const completionCrews = await db
		.collection(COMPLETION_CREWS_COLLECTION)
		.find({ scheduleSetting: { $in: scheduleSettingsIds } })
		.toArray();

	return batch.map((settings) => {
		const filterResources = (resource) => {
			return resource.scheduleSetting.toString() === settings._id.toString();
		};

		const settingsPrimaryRigs = primaryRigs.filter(filterResources);
		const settingsSpudRigs = spudRigs.filter(filterResources);
		const settingsCompletionCrews = completionCrews.filter(filterResources);

		return {
			updateOne: {
				filter: { _id: settings._id },
				update: {
					$set: {
						primaryRigs: mapId(settingsPrimaryRigs),
						spudRigs: mapId(settingsSpudRigs),
						completionCrews: mapId(settingsCompletionCrews),
						wellPreference: [],
						general: getGeneral(settings),
					},
					$unset: {
						resources: '',
						activitySteps: '',
						startProgram: '',
					},
				},
			},
		};
	});
};

const batchUpdateDown = createBatchBulkUpdate({
	collection: SCHEDULE_SETTINGS_COLLECTION,
	buildUpdates: runUpdatesDown,
});

async function down({ db }) {
	await batchInsertRigsDown(PRIMARY_RIGS_COLLECTION)({ db });
	await batchInsertRigsDown(SPUD_RIGS_COLLECTION)({ db });
	await batchInsertRigsDown(COMPLETION_CREWS_COLLECTION)({ db });

	await batchUpdateDown({ db });
}

module.exports = { up, down, uses: ['mongodb'], DATE_IDX_LARGE };
