// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20230731135805-elt-unit-value-missing');

let collection;
let db;
let mongod;
let client;

const brokenELTModelNGL = {
	lines: [
		[
			{
				key: 'key',
				value: 'ngl',
			},
			{
				key: 'category',
				value: 'gathering',
			},
			{
				key: 'criteria',
				value: 'entire_well_life',
			},
			{
				key: 'period',
				value: 'Flat',
			},
			{
				key: 'value',
				value: 1,
			},
		],
		[
			{
				key: 'key',
				value: 'ngl',
			},
		],
	],
	assumptionKey: 'expenses',
};

const correctELTModelNGL = {
	lines: [
		[
			{
				key: 'key',
				value: 'ngl',
			},
			{
				key: 'category',
				value: 'gathering',
			},
			{
				key: 'criteria',
				value: 'entire_well_life',
			},
			{
				key: 'period',
				value: 'Flat',
			},
			{
				key: 'value',
				value: 1,
			},
			{
				key: 'unit',
				value: 'dollar_per_bbl',
			},
		],
		[
			{
				key: 'key',
				value: 'ngl',
			},
			{
				key: 'unit',
				value: 'dollar_per_bbl',
			},
		],
	],
	assumptionKey: 'expenses',
};

const brokenELTModelDripCondensate = {
	lines: [
		[
			{
				key: 'key',
				value: 'drip_condensate',
			},
			{
				key: 'category',
				value: 'gathering',
			},
			{
				key: 'criteria',
				value: 'entire_well_life',
			},
			{
				key: 'period',
				value: 'Flat',
			},
			{
				key: 'value',
				value: 1,
			},
		],
		[
			{
				key: 'key',
				value: 'drip_condensate',
			},
		],
	],
	assumptionKey: 'expenses',
};

const correctELTModelDripCondensate = {
	lines: [
		[
			{
				key: 'key',
				value: 'drip_condensate',
			},
			{
				key: 'category',
				value: 'gathering',
			},
			{
				key: 'criteria',
				value: 'entire_well_life',
			},
			{
				key: 'period',
				value: 'Flat',
			},
			{
				key: 'value',
				value: 1,
			},
			{
				key: 'unit',
				value: 'dollar_per_bbl',
			},
		],
		[
			{
				key: 'key',
				value: 'drip_condensate',
			},
			{
				key: 'unit',
				value: 'dollar_per_bbl',
			},
		],
	],
	assumptionKey: 'expenses',
};

const brokenELTModelNeither = {
	lines: [
		[
			{
				key: 'key',
				value: 'oil',
			},
			{
				key: 'category',
				value: 'gathering',
			},
			{
				key: 'criteria',
				value: 'entire_well_life',
			},
			{
				key: 'period',
				value: 'Flat',
			},
			{
				key: 'value',
				value: 1,
			},
		],
		[
			{
				key: 'key',
				value: 'oil',
			},
		],
	],
	assumptionKey: 'expenses',
};

const correctELTModelNeither = {
	lines: [
		[
			{
				key: 'key',
				value: 'oil',
			},
			{
				key: 'category',
				value: 'gathering',
			},
			{
				key: 'criteria',
				value: 'entire_well_life',
			},
			{
				key: 'period',
				value: 'Flat',
			},
			{
				key: 'value',
				value: 1,
			},
		],
		[
			{
				key: 'key',
				value: 'oil',
			},
		],
	],
	assumptionKey: 'expenses',
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('embedded-lookup-tables');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('elt-unit-field-ngl', () => {
	test('up', async () => {
		await collection.insertOne(brokenELTModelNGL);
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.lines).toStrictEqual(correctELTModelNGL.lines);
	});

	test('down', async () => {
		await collection.insertOne(correctELTModelNGL);
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.lines).toStrictEqual(brokenELTModelNGL.lines);
	});
});

describe('elt-unit-field-drip-condensate', () => {
	test('up', async () => {
		await collection.insertOne(brokenELTModelDripCondensate);
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.lines).toStrictEqual(correctELTModelDripCondensate.lines);
	});

	test('down', async () => {
		await collection.insertOne(correctELTModelDripCondensate);
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.lines).toStrictEqual(brokenELTModelDripCondensate.lines);
	});
});

describe('elt-unit-field-neither', () => {
	test('up', async () => {
		await collection.insertOne(brokenELTModelNeither);
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.lines).toStrictEqual(correctELTModelNeither.lines);
	});

	test('down', async () => {
		await collection.insertOne(correctELTModelNeither);
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.lines).toStrictEqual(brokenELTModelNeither.lines);
	});
});
