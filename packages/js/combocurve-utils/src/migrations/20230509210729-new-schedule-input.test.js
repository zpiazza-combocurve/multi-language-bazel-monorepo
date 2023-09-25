// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('bson');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20230509210729-new-schedule-input.js');

let db;
let mongod;
let client;
let schedules;
let scheduleUmbrellas;
let umbrellaData;
let assignmentData;
let inputQualifiers;

const dataForScheduleWithUmbrella = {
	schedule: {
		_id: new ObjectId('645ab0fd781d2b0021dd45ea'),
		assignments: [
			new ObjectId('645ab0fd781d2b0021dd45eb'),
			new ObjectId('645ab0fd781d2b0021dd45ec'),
			new ObjectId('645ab0fd781d2b0021dd45ed'),
		],
		modified: true,
		constructed: false,
		tags: [],
		method: 'auto',
		name: 'asdfasdf',
		project: new ObjectId('63c1b40eb322695e549724a8'),
		createdBy: new ObjectId('611beca03556540015af8562'),
		createdAt: '2023-05-09T20:45:49.156',
		updatedAt: '2023-05-09T23:47:41.743',
		__v: 0,
		activeUmbrellas: {
			status: '645ab104781d2b0021dd4622',
		},
	},

	umbrella: {
		_id: new ObjectId('645ab104781d2b0021dd4622'),
		column: 'status',
		name: 'STAT_2023_Q2',
		createdBy: new ObjectId('611beca03556540015af8562'),
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		createdAt: '2023-05-09T20:45:56.794',
		updatedAt: '2023-05-09T20:45:56.794',
		__v: 0,
	},

	assignments: [
		{
			_id: new ObjectId('645ab0fd781d2b0021dd45eb'),
			well: new ObjectId('5e272d39b78910dd2a1bd929'),
			schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
			project: new ObjectId('63c1b40eb322695e549724a8'),
			values: {
				status: 'pad_prepared',
			},
			__v: 0,
			order: 1,
		},
		{
			_id: new ObjectId('645ab0fd781d2b0021dd45ec'),
			well: new ObjectId('5e272d39b78910dd2a1bd933'),
			schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
			project: new ObjectId('63c1b40eb322695e549724a8'),
			values: {
				status: 'pad_prepared',
			},
			__v: 0,
			order: 2,
		},
		{
			_id: new ObjectId('645ab0fd781d2b0021dd45ed'),
			well: new ObjectId('5e272d39b78910dd2a1bd93b'),
			schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
			project: new ObjectId('63c1b40eb322695e549724a8'),
			values: {
				status: 'completed',
			},
			__v: 0,
			order: 3,
		},
	],
};

const dataForScheduleWithoutWells = {
	schedule: {
		_id: new ObjectId('645ade2c781d2b0021dd6d36'),
		assignments: [],
		modified: false,
		constructed: false,
		tags: [],
		method: 'auto',
		name: 'no wells',
		project: new ObjectId('63c1b40eb322695e549724a8'),
		createdBy: new ObjectId('611beca03556540015af8562'),
		createdAt: '2023-05-09T23:58:36.155',
		updatedAt: '2023-05-09T23:58:36.155',
		__v: 0,
	},
};

const umbrellasNotInSchedules = [
	{
		_id: new ObjectId('645adb99781d2b0021dd6c9e'),
		column: 'status',
		name: 'STAT_2023_Q2_1',
		createdBy: new ObjectId('611beca03556540015af8562'),
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		createdAt: '2023-05-09T23:47:37.599',
		updatedAt: '2023-05-09T23:47:37.599',
		__v: 0,
	},
	{
		_id: new ObjectId('645be9f410922a00216ee781'),
		column: 'status',
		name: 'STAT_2023_Q2',
		createdBy: new ObjectId('611beca03556540015af8562'),
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ade2c781d2b0021dd6d36'),
		updatedAt: '2023-05-10T19:01:08.669',
		createdAt: '2023-05-10T19:01:08.669',
		__v: 0,
	},
];

const umbrellasData = [
	{
		_id: new ObjectId('645ab104781d2b0021dd4625'),
		column: 'status',
		well: new ObjectId('5e272d39b78910dd2a1bd929'),
		assignment: new ObjectId('645ab0fd781d2b0021dd45eb'),
		umbrella: new ObjectId('645ab104781d2b0021dd4622'),
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		value: {
			status: 'pad_prepared',
		},
		__v: 0,
	},
	{
		_id: new ObjectId('645ab104781d2b0021dd4626'),
		column: 'status',
		well: new ObjectId('5e272d39b78910dd2a1bd933'),
		assignment: new ObjectId('645ab0fd781d2b0021dd45ec'),
		umbrella: new ObjectId('645ab104781d2b0021dd4622'),
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		value: {
			status: 'pad_prepared',
		},
		__v: 0,
	},
	{
		_id: new ObjectId('645ab104781d2b0021dd4627'),
		column: 'status',
		well: new ObjectId('5e272d39b78910dd2a1bd93b'),
		assignment: new ObjectId('645ab0fd781d2b0021dd45ed'),
		umbrella: new ObjectId('645ab104781d2b0021dd4622'),
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		value: {
			status: 'completed',
		},
		__v: 0,
	},
	{
		_id: new ObjectId('645adb99781d2b0021dd6ca1'),
		column: 'status',
		well: new ObjectId('5e272d39b78910dd2a1bd929'),
		assignment: new ObjectId('645ab0fd781d2b0021dd45eb'),
		umbrella: new ObjectId('645adb99781d2b0021dd6c9e'),
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		value: {
			status: 'pad_prepared',
		},
		__v: 0,
	},
	{
		_id: new ObjectId('645adb99781d2b0021dd6ca3'),
		column: 'status',
		well: new ObjectId('5e272d39b78910dd2a1bd93b'),
		assignment: new ObjectId('645ab0fd781d2b0021dd45ed'),
		umbrella: new ObjectId('645adb99781d2b0021dd6c9e'),
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		value: {
			status: 'completed',
		},
		__v: 0,
	},
	{
		_id: new ObjectId('645adb99781d2b0021dd6ca2'),
		column: 'status',
		well: new ObjectId('5e272d39b78910dd2a1bd933'),
		assignment: new ObjectId('645ab0fd781d2b0021dd45ec'),
		umbrella: new ObjectId('645adb99781d2b0021dd6c9e'),
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		value: {
			status: 'pad_prepared',
		},
		__v: 0,
	},
];

const updatedScheduleWithUmbrella = {
	_id: new ObjectId('645ab0fd781d2b0021dd45ea'),
	project: new ObjectId('63c1b40eb322695e549724a8'),
	name: 'asdfasdf',
	createdBy: new ObjectId('611beca03556540015af8562'),
	createdAt: '2023-05-09T20:45:49.156',
	updatedAt: '2023-05-09T23:47:41.743',
	method: 'auto',
	modified: true,
	constructed: false,
	tags: [],
	inputData: [
		{
			well: new ObjectId('5e272d39b78910dd2a1bd929'),
			priority: 1,
			status: 'pad_prepared',
		},
		{
			well: new ObjectId('5e272d39b78910dd2a1bd933'),
			priority: 2,
			status: 'pad_prepared',
		},
		{
			well: new ObjectId('5e272d39b78910dd2a1bd93b'),
			priority: 3,
			status: 'completed',
		},
	],
	qualifiers: [
		{
			inputField: 'status',
			qualifier: new ObjectId('645ab104781d2b0021dd4622'),
			qualifierName: 'STAT_2023_Q2',
		},
	],
	__v: 0,
};

const updatedScheduleWithoutUmbrella = {
	_id: new ObjectId('645ade2c781d2b0021dd6d36'),
	modified: false,
	constructed: false,
	tags: [],
	method: 'auto',
	name: 'no wells',
	project: new ObjectId('63c1b40eb322695e549724a8'),
	createdBy: new ObjectId('611beca03556540015af8562'),
	createdAt: '2023-05-09T23:58:36.155',
	updatedAt: '2023-05-09T23:58:36.155',
	qualifiers: [],
	inputData: [],
	__v: 0,
};

const updatedQualifiers = [
	{
		_id: new ObjectId('645ab104781d2b0021dd4622'),
		inputField: 'status',
		createdBy: new ObjectId('611beca03556540015af8562'),
		createdAt: '2023-05-09T20:45:56.794',
		updatedAt: '2023-05-09T20:45:56.794',
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		name: 'STAT_2023_Q2',
		qualifierAssignments: [
			{
				well: new ObjectId('5e272d39b78910dd2a1bd929'),
				value: 'pad_prepared',
			},
			{
				well: new ObjectId('5e272d39b78910dd2a1bd933'),
				value: 'pad_prepared',
			},
			{
				well: new ObjectId('5e272d39b78910dd2a1bd93b'),
				value: 'completed',
			},
		],
		__v: 0,
	},
	{
		_id: new ObjectId('645adb99781d2b0021dd6c9e'),
		inputField: 'status',
		createdBy: new ObjectId('611beca03556540015af8562'),
		createdAt: '2023-05-09T23:47:37.599',
		updatedAt: '2023-05-09T23:47:37.599',
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ab0fd781d2b0021dd45ea'),
		name: 'STAT_2023_Q2_1',
		qualifierAssignments: [
			{
				well: new ObjectId('5e272d39b78910dd2a1bd929'),
				value: 'pad_prepared',
			},
			{
				well: new ObjectId('5e272d39b78910dd2a1bd93b'),
				value: 'completed',
			},
			{
				well: new ObjectId('5e272d39b78910dd2a1bd933'),
				value: 'pad_prepared',
			},
		],
		__v: 0,
	},
	{
		_id: new ObjectId('645be9f410922a00216ee781'),
		inputField: 'status',
		createdBy: new ObjectId('611beca03556540015af8562'),
		createdAt: '2023-05-10T19:01:08.669',
		updatedAt: '2023-05-10T19:01:08.669',
		project: new ObjectId('63c1b40eb322695e549724a8'),
		schedule: new ObjectId('645ade2c781d2b0021dd6d36'),
		name: 'STAT_2023_Q2',
		qualifierAssignments: [],
		__v: 0,
	},
];

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('new-schedule-input up', () => {
	beforeEach(async () => {
		({ db, mongod, client } = await setupDb());

		schedules = db.collection('schedules');
		scheduleUmbrellas = db.collection('schedule-umbrellas');
		umbrellaData = db.collection('schedule-umbrella-datas');
		assignmentData = db.collection('schedule-well-assignments');
		inputQualifiers = db.collection('schedule-input-qualifiers');

		await schedules.insertMany([dataForScheduleWithUmbrella.schedule, dataForScheduleWithoutWells.schedule]);
		await scheduleUmbrellas.insertMany([dataForScheduleWithUmbrella.umbrella, ...umbrellasNotInSchedules]);
		await umbrellaData.insertMany(umbrellasData);
		await assignmentData.insertMany(dataForScheduleWithUmbrella.assignments);
	});

	it('deletes and renames the collections', async () => {
		await up({ db });
		await db
			.listCollections()
			.toArray()
			.then((collections) => {
				let foundQualifiers = false;
				collections.forEach((col) => {
					foundQualifiers = foundQualifiers || col.name === 'schedule-input-qualifiers';
					expect(col.name).not.toBe('schedule-umbrella-datas');
					expect(col.name).not.toBe('schedule-umbrellas');
					expect(col.name).not.toBe('schedule-well-assignments');
				});
				expect(foundQualifiers).toBeTruthy();
			});
	});

	it('migrates the data', async () => {
		await up({ db });
		await up({ db });

		const scheduleOne = await schedules.findOne({
			_id: new ObjectId('645ab0fd781d2b0021dd45ea'),
		});
		const scheduleTwo = await schedules.findOne({
			_id: new ObjectId('645ade2c781d2b0021dd6d36'),
		});
		const qualifiers = await inputQualifiers.find({}).toArray();

		expect(scheduleOne).toEqual(updatedScheduleWithUmbrella);
		expect(scheduleTwo).toEqual(updatedScheduleWithoutUmbrella);
		expect(qualifiers).toEqual(updatedQualifiers);
	});
});

describe('new-schedule-input down', () => {
	beforeEach(async () => {
		({ db, mongod, client } = await setupDb());

		schedules = db.collection('schedules');
		scheduleUmbrellas = db.collection('schedule-umbrellas');
		umbrellaData = db.collection('schedule-umbrella-datas');
		assignmentData = db.collection('schedule-well-assignments');
		inputQualifiers = db.collection('schedule-input-qualifiers');

		await schedules.insertMany([updatedScheduleWithUmbrella, updatedScheduleWithoutUmbrella]);

		await inputQualifiers.insertMany(updatedQualifiers);
	});

	it('adds and renames the collections', async () => {
		await down({ db });
		const collections = await db.listCollections().toArray();
		expect(collections.map((col) => col.name)).toContain('schedule-umbrella-datas');
		expect(collections.map((col) => col.name)).toContain('schedule-umbrellas');
		expect(collections.map((col) => col.name)).toContain('schedule-well-assignments');
		expect(collections.map((col) => col.name)).not.toContain('schedule-input-qualifiers');
	});

	it('migrates the data', async () => {
		await down({ db });
		await down({ db });

		const scheduleAssignments = await assignmentData.find().toArray();
		expect(
			scheduleAssignments.map((doc) => {
				delete doc._id;
				return doc;
			})
		).toEqual(
			dataForScheduleWithUmbrella.assignments.map((doc) => {
				delete doc._id;
				return doc;
			})
		);

		const { assignments, ...preservedData } = await schedules.findOne(new ObjectId('645ab0fd781d2b0021dd45ea'));
		delete dataForScheduleWithUmbrella.schedule.assignments;
		const scheduleWithoutWells = await schedules.findOne(new ObjectId('645ade2c781d2b0021dd6d36'));
		expect(assignments.length).toEqual(3);
		expect(preservedData).toEqual(dataForScheduleWithUmbrella.schedule);
		expect(scheduleWithoutWells).toEqual(dataForScheduleWithoutWells.schedule);

		const umbrellas = await scheduleUmbrellas.find().toArray();
		expect(umbrellas).toEqual([dataForScheduleWithUmbrella.umbrella, ...umbrellasNotInSchedules]);

		const migratedUmbrellaData = await umbrellaData.find().toArray();
		expect(
			migratedUmbrellaData.map((doc) => {
				delete doc._id;
				delete doc.assignment;
				return doc;
			})
		).toEqual(
			umbrellasData.map((doc) => {
				delete doc._id;
				delete doc.assignment;
				return doc;
			})
		);
	});
});
