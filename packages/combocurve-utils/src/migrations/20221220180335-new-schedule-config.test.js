// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('bson');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { DATE_IDX_LARGE, up, down } = require('./20221220180335-new-schedule-config');

let db;
let mongod;
let client;

let scheduleSettings;
let completionCrews;
let primaryRigs;
let spudRigs;

const oldScheduleSettings = [
	{
		_id: new ObjectId('639b335ea003e950f88d3e28'),
		primaryRigs: [new ObjectId('639b335ea003e950f88d3e29'), new ObjectId('639b335ea003e950f88d3e30')],
		spudRigs: [],
		completionCrews: [new ObjectId('639b335ea003e950f88d3e2c')],
		name: 'Test config',
		general: {
			startProgram: 44908,
			facilityDays: 15,
			padPreparationDays: 5,
			padPreparationCrewCount: 2,
			padDrilling: {
				enabled: true,
				batch: false,
			},
			padCompletion: {
				enabled: true,
				batch: false,
			},
			maxDUC: null,
			applyWellPreference: 'drill',
		},
		wellPreference: [],
		project: new ObjectId('63487ee1dc31630012b224a0'),
		createdBy: new ObjectId('62686a77383b530012a0f42e'),
		createdAt: '2022-12-15T14:46:54.888+0000',
		updatedAt: '2022-12-20T20:58:36.356+0000',
	},
	{
		_id: new ObjectId('639b335ea003e950f88d3e31'),
		primaryRigs: [new ObjectId('739b335ea003e950f88d3e33')],
		spudRigs: [new ObjectId('639b335ea003e950f88d3e33')],
		completionCrews: [new ObjectId('639b335ea003e950f88d3e2d')],
		name: 'Test config 2',
		general: {
			startProgram: 44908,
			facilityDays: 5,
			padPreparationDays: 5,
			padPreparationCrewCount: 1,
			padDrilling: {
				enabled: true,
				batch: false,
			},
			padCompletion: {
				enabled: true,
				batch: true,
			},
			maxDUC: null,
			applyWellPreference: 'drill',
		},
		wellPreference: [],
		project: new ObjectId('63487ee1dc31630012b224a0'),
		createdBy: new ObjectId('62686a77383b530012a0f42e'),
		createdAt: '2022-12-15T14:46:54.888+0000',
		updatedAt: '2022-12-20T20:58:36.356+0000',
	},
	{
		_id: new ObjectId('639b335ea003e950f88d3e32'),
		primaryRigs: [new ObjectId('739b335ea003e950f88d3e34')],
		spudRigs: [],
		completionCrews: [new ObjectId('639b335ea003e950f88d3e2e')],
		name: 'No pad preparation days',
		general: {
			startProgram: 44908,
			facilityDays: 5,
			padPreparationDays: 0,
			padPreparationCrewCount: 1,
			padDrilling: {
				enabled: true,
				batch: false,
			},
			padCompletion: {
				enabled: true,
				batch: true,
			},
			maxDUC: null,
			applyWellPreference: 'drill',
		},
		wellPreference: [],
		project: new ObjectId('63487ee1dc31630012b224a0'),
		createdBy: new ObjectId('62686a77383b530012a0f42e'),
		createdAt: '2022-12-15T14:46:54.888+0000',
		updatedAt: '2022-12-20T20:58:36.356+0000',
	},
	{
		_id: new ObjectId('639b335ea003e950f88d3e33'),
		primaryRigs: [new ObjectId('739b335ea003e950f88d3e35')],
		spudRigs: [],
		completionCrews: [new ObjectId('639b335ea003e950f88d3e2f')],
		name: 'No pad preparation crews',
		general: {
			startProgram: 44908,
			facilityDays: 5,
			padPreparationDays: 5,
			padPreparationCrewCount: 0,
			padDrilling: {
				enabled: true,
				batch: false,
			},
			padCompletion: {
				enabled: true,
				batch: true,
			},
			maxDUC: null,
			applyWellPreference: 'drill',
		},
		wellPreference: [],
		project: new ObjectId('63487ee1dc31630012b224a0'),
		createdBy: new ObjectId('62686a77383b530012a0f42e'),
		createdAt: '2022-12-15T14:46:54.888+0000',
		updatedAt: '2022-12-20T20:58:36.356+0000',
	},
];

const oldPrimaryRig = [
	{
		_id: new ObjectId('639b335ea003e950f88d3e29'),
		active: true,
		availability: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2a'),
				start: 44908,
				end: 117958,
			},
			{
				_id: new ObjectId('639b335ea003e950f88d3e2b'),
				start: 117958,
				end: 118958,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 1,
		workingDays: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2b'),
				start: 44908,
				end: 63171,
				value: 16,
			},
		],
		workOnHolidays: true,
		name: 'Primary Rig 1',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e28'),
	},
	{
		_id: new ObjectId('639b335ea003e950f88d3e30'),
		active: true,
		availability: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2a'),
				start: 44908,
				end: 117958,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 1,
		workingDays: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2b'),
				start: 44908,
				end: 63171,
				value: 15,
			},
		],
		workOnHolidays: true,
		name: 'Primary Rig 2',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e28'),
	},
	{
		_id: new ObjectId('739b335ea003e950f88d3e33'),
		active: true,
		availability: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2a'),
				start: 44908,
				end: 117958,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 2,
		workingDays: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2b'),
				start: 44908,
				end: 63171,
				value: 15,
			},
		],
		workOnHolidays: false,
		name: 'Primary Rig',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e31'),
	},
	{
		_id: new ObjectId('739b335ea003e950f88d3e34'),
		active: true,
		availability: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2a'),
				start: 44908,
				end: 117958,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 2,
		workingDays: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2b'),
				start: 44908,
				end: 63171,
				value: 15,
			},
		],
		workOnHolidays: false,
		name: 'Primary Rig 1',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e32'),
	},
	{
		_id: new ObjectId('739b335ea003e950f88d3e35'),
		active: true,
		availability: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2a'),
				start: 44908,
				end: 117958,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 2,
		workingDays: [
			{
				_id: new ObjectId('639b335ea003e950f88d3e2b'),
				start: 44908,
				end: 63171,
				value: 15,
			},
		],
		workOnHolidays: false,
		name: 'Primary Rig 1',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e33'),
	},
];

const oldSpudRig = [
	{
		_id: new ObjectId('639b335ea003e950f88d3e33'),
		active: true,
		availability: [
			{
				start: 44921,
				end: 117971,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 1,
		workingDays: [
			{
				start: 44921,
				end: 63184,
				value: 15,
			},
		],
		workOnHolidays: true,
		name: 'Spud Rig 1',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e31'),
	},
];

const oldCompletionCrew = [
	{
		_id: new ObjectId('639b335ea003e950f88d3e2c'),
		active: true,
		availability: [
			{
				start: 44908,
				end: 117954,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 1,
		workingDays: [
			{
				start: 44908,
				end: 63171,
				value: 14,
			},
		],
		workOnHolidays: true,
		name: 'Completion Crew 1',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e28'),
	},
	{
		_id: new ObjectId('639b335ea003e950f88d3e2d'),
		active: true,
		availability: [
			{
				start: 44908,
				end: 117954,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 1,
		workingDays: [
			{
				start: 44908,
				end: 63171,
				value: 5,
			},
		],
		workOnHolidays: true,
		name: 'Completion Crew 1',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e31'),
	},
	{
		_id: new ObjectId('639b335ea003e950f88d3e2e'),
		active: true,
		availability: [
			{
				start: 44908,
				end: 117954,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 1,
		workingDays: [
			{
				start: 44908,
				end: 63171,
				value: 5,
			},
		],
		workOnHolidays: true,
		name: 'Completion Crew 1',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e32'),
	},
	{
		_id: new ObjectId('639b335ea003e950f88d3e2f'),
		active: true,
		availability: [
			{
				start: 44908,
				end: 117954,
			},
		],
		demobilizationDays: 1,
		extendToFinish: true,
		locations: [],
		mobilizationDays: 1,
		workingDays: [
			{
				start: 44908,
				end: 63171,
				value: 5,
			},
		],
		workOnHolidays: true,
		name: 'Completion Crew 1',
		project: new ObjectId('63487ee1dc31630012b224a0'),
		scheduleSetting: new ObjectId('639b335ea003e950f88d3e33'),
	},
];

const newScheduleSettings = [
	{
		resources: [
			{
				stepIdx: [0],
				active: true,
				availability: { start: 1, end: DATE_IDX_LARGE },
				demobilizationDays: 0,
				mobilizationDays: 0,
				workOnHolidays: true,
				name: 'Pad Preparation Crew 1',
			},
			{
				stepIdx: [0],
				active: true,
				availability: { start: 1, end: DATE_IDX_LARGE },
				demobilizationDays: 0,
				mobilizationDays: 0,
				workOnHolidays: true,
				name: 'Pad Preparation Crew 2',
			},
			{
				stepIdx: [1],
				active: true,
				availability: { start: 44908, end: 117958 },
				demobilizationDays: 1,
				mobilizationDays: 1,
				workOnHolidays: true,
				name: 'Primary Rig 1 - 1',
			},
			{
				stepIdx: [1],
				active: true,
				availability: { start: 117958, end: 118958 },
				demobilizationDays: 1,
				mobilizationDays: 1,
				workOnHolidays: true,
				name: 'Primary Rig 1 - 2',
			},
			{
				stepIdx: [1],
				active: true,
				availability: { start: 44908, end: 117958 },
				demobilizationDays: 1,
				mobilizationDays: 1,
				workOnHolidays: true,
				name: 'Primary Rig 2',
			},
			{
				stepIdx: [2],
				active: true,
				availability: { start: 44908, end: 117954 },
				demobilizationDays: 1,
				mobilizationDays: 1,
				workOnHolidays: true,
				name: 'Completion Crew 1',
			},
		],
		activitySteps: [
			{
				stepIdx: 0,
				previousStepIdx: [],
				name: 'Pad Preparation',
				padOperation: 'parallel',
				stepDuration: { days: 5, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 1,
				previousStepIdx: [0],
				name: 'Drill',
				padOperation: 'sequence',
				stepDuration: { days: 16, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 2,
				previousStepIdx: [1],
				name: 'Completion',
				padOperation: 'sequence',
				stepDuration: { days: 14, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 3,
				previousStepIdx: [2],
				name: 'Facility Construction',
				padOperation: 'parallel',
				stepDuration: { days: 15, useLookup: false },
				requiresResources: false,
			},
		],
		_id: new ObjectId('639b335ea003e950f88d3e28'),
		name: 'Test config',
		startProgram: 44908,
		project: new ObjectId('63487ee1dc31630012b224a0'),
		createdBy: new ObjectId('62686a77383b530012a0f42e'),
		createdAt: '2022-12-15T14:46:54.888+0000',
		updatedAt: '2022-12-20T20:58:36.356+0000',
	},
	{
		resources: [
			{
				stepIdx: [0],
				active: true,
				availability: { start: 1, end: DATE_IDX_LARGE },
				demobilizationDays: 0,
				mobilizationDays: 0,
				workOnHolidays: true,
				name: 'Pad Preparation Crew 1',
			},
			{
				stepIdx: [2],
				active: true,
				availability: { start: 44908, end: 117958 },
				demobilizationDays: 1,
				mobilizationDays: 2,
				workOnHolidays: false,
				name: 'Primary Rig',
			},
			{
				stepIdx: [1],
				active: true,
				availability: { start: 44921, end: 117971 },
				demobilizationDays: 1,
				mobilizationDays: 1,
				workOnHolidays: true,
				name: 'Spud Rig 1',
			},
			{
				stepIdx: [3],
				active: true,
				availability: { start: 44908, end: 117954 },
				demobilizationDays: 1,
				mobilizationDays: 1,
				workOnHolidays: true,
				name: 'Completion Crew 1',
			},
		],
		activitySteps: [
			{
				stepIdx: 0,
				previousStepIdx: [],
				name: 'Pad Preparation',
				padOperation: 'parallel',
				stepDuration: { days: 5, useLookup: false },
				requiresResources: true,
			},

			{
				stepIdx: 1,
				previousStepIdx: [0],
				name: 'Spud',
				padOperation: 'disabled',
				stepDuration: { days: 15, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 2,
				previousStepIdx: [1],
				name: 'Drill',
				padOperation: 'sequence',
				stepDuration: { days: 15, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 3,
				previousStepIdx: [2],
				name: 'Completion',
				padOperation: 'batch',
				stepDuration: { days: 5, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 4,
				previousStepIdx: [3],
				name: 'Facility Construction',
				padOperation: 'parallel',
				stepDuration: { days: 5, useLookup: false },
				requiresResources: false,
			},
		],
		_id: new ObjectId('639b335ea003e950f88d3e31'),
		name: 'Test config 2',
		startProgram: 44908,
		project: new ObjectId('63487ee1dc31630012b224a0'),
		createdBy: new ObjectId('62686a77383b530012a0f42e'),
		createdAt: '2022-12-15T14:46:54.888+0000',
		updatedAt: '2022-12-20T20:58:36.356+0000',
	},
	{
		resources: [
			{
				stepIdx: [],
				active: false,
				availability: { start: 1, end: DATE_IDX_LARGE },
				demobilizationDays: 0,
				mobilizationDays: 0,
				workOnHolidays: true,
				name: 'Pad Preparation Crew 1',
			},
			{
				stepIdx: [0],
				active: true,
				availability: { start: 44908, end: 117958 },
				demobilizationDays: 1,
				mobilizationDays: 2,
				workOnHolidays: false,
				name: 'Primary Rig 1',
			},
			{
				stepIdx: [1],
				active: true,
				availability: { start: 44908, end: 117954 },
				demobilizationDays: 1,
				mobilizationDays: 1,
				workOnHolidays: true,
				name: 'Completion Crew 1',
			},
		],
		activitySteps: [
			{
				stepIdx: 0,
				previousStepIdx: [],
				name: 'Drill',
				padOperation: 'sequence',
				stepDuration: { days: 15, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 1,
				previousStepIdx: [0],
				name: 'Completion',
				padOperation: 'batch',
				stepDuration: { days: 5, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 2,
				previousStepIdx: [1],
				name: 'Facility Construction',
				padOperation: 'parallel',
				stepDuration: { days: 5, useLookup: false },
				requiresResources: false,
			},
		],
		_id: new ObjectId('639b335ea003e950f88d3e32'),
		name: 'No pad preparation days',
		startProgram: 44908,
		project: new ObjectId('63487ee1dc31630012b224a0'),
		createdBy: new ObjectId('62686a77383b530012a0f42e'),
		createdAt: '2022-12-15T14:46:54.888+0000',
		updatedAt: '2022-12-20T20:58:36.356+0000',
	},
	{
		resources: [
			{
				stepIdx: [1],
				active: true,
				availability: { start: 44908, end: 117958 },
				demobilizationDays: 1,
				mobilizationDays: 2,
				workOnHolidays: false,
				name: 'Primary Rig 1',
			},
			{
				stepIdx: [2],
				active: true,
				availability: { start: 44908, end: 117954 },
				demobilizationDays: 1,
				mobilizationDays: 1,
				workOnHolidays: true,
				name: 'Completion Crew 1',
			},
		],
		activitySteps: [
			{
				stepIdx: 0,
				previousStepIdx: [],
				name: 'Pad Preparation',
				padOperation: 'parallel',
				stepDuration: { days: 5, useLookup: false },
				requiresResources: false,
			},

			{
				stepIdx: 1,
				previousStepIdx: [0],
				name: 'Drill',
				padOperation: 'sequence',
				stepDuration: { days: 15, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 2,
				previousStepIdx: [1],
				name: 'Completion',
				padOperation: 'batch',
				stepDuration: { days: 5, useLookup: false },
				requiresResources: true,
			},
			{
				stepIdx: 3,
				previousStepIdx: [2],
				name: 'Facility Construction',
				padOperation: 'parallel',
				stepDuration: { days: 5, useLookup: false },
				requiresResources: false,
			},
		],
		_id: new ObjectId('639b335ea003e950f88d3e33'),
		name: 'No pad preparation crews',
		startProgram: 44908,
		project: new ObjectId('63487ee1dc31630012b224a0'),
		createdBy: new ObjectId('62686a77383b530012a0f42e'),
		createdAt: '2022-12-15T14:46:54.888+0000',
		updatedAt: '2022-12-20T20:58:36.356+0000',
	},
];

describe('new-schedule-config', () => {
	beforeEach(async () => {
		({ db, mongod, client } = await setupDb());

		scheduleSettings = db.collection('schedule-settings');
		completionCrews = db.collection('schedule-setting-completion-crews');
		primaryRigs = db.collection('schedule-setting-primary-rigs');
		spudRigs = db.collection('schedule-setting-spud-rigs');
	});

	afterEach(async () => {
		await mongod.stop();
		await client.close();
	});

	test('up', async () => {
		await scheduleSettings.insertMany(oldScheduleSettings);

		await primaryRigs.insertMany(oldPrimaryRig);
		await spudRigs.insertMany(oldSpudRig);
		await completionCrews.insertMany(oldCompletionCrew);

		await up({ db });
		await up({ db });

		const scheduleSettingsDocs = await scheduleSettings.find({}).toArray();
		expect(scheduleSettingsDocs).toEqual(newScheduleSettings);
	});

	it('down', async () => {
		await scheduleSettings.insertMany(newScheduleSettings);

		await primaryRigs.insertMany(oldPrimaryRig);
		await spudRigs.insertMany(oldSpudRig);
		await completionCrews.insertMany(oldCompletionCrew);

		await down({ db });
		await down({ db });

		const scheduleSettingsDocs = await scheduleSettings.find({}).toArray();
		expect(scheduleSettingsDocs).toEqual(oldScheduleSettings);
	});
});
