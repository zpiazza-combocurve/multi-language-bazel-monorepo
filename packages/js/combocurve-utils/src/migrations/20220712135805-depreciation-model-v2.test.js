// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down, depreciationHeadersV1, depreciationHeadersV2 } = require('./20220712135805-depreciation-model-v2');

let collection;
let db;
let mongod;
let client;

const defaultDownDepreciationModelOption = {
	depreciation_model: {
		row_view: {
			headers: depreciationHeadersV1,
			rows: [
				{
					year: 1,
					factor: 50,
					cumulative: 50,
				},
				{
					year: 2,
					factor: 50,
					cumulative: 100,
				},
			],
		},
	},
};

const defaultDownDepreciationModelEconFunction = {
	depreciation_model: {
		rows: [
			{
				year: 1,
				factor: 50,
				cumulative: 50,
			},
			{
				year: 2,
				factor: 50,
				cumulative: 100,
			},
		],
	},
};

const defaultUpDepreciationModelOption = {
	depreciation_model: {
		prebuilt: {
			label: 'Custom',
			value: 'custom',
		},
		depreciation_or_depletion: {
			label: 'Depreciation',
			value: 'depreciation',
		},
		tangible_depletion_model: {
			label: 'Unit Of Production (Major Phase)',
			value: 'unit_of_production_major',
		},
		intangible_depletion_model: {
			label: 'Unit Of Production (Major Phase)',
			value: 'unit_of_production_major',
		},
		depreciation: {
			subItems: {
				row_view: {
					headers: depreciationHeadersV2,
					rows: [
						{
							year: 1,
							tan_factor: 50,
							tan_cumulative: 50,
							intan_factor: 100,
							intan_cumulative: 100,
						},
						{
							year: 2,
							tan_factor: 50,
							tan_cumulative: 100,
							intan_factor: 0,
							intan_cumulative: 100,
						},
					],
				},
			},
		},
	},
};

const defaultUpDepreciationModelEconFunction = {
	depreciation_model: {
		prebuilt: 'custom',
		depreciation_or_depletion: 'depletion',
		tangible_depletion_model: 'unit_of_production_major',
		intangible_depletion_model: 'unit_of_production_major',
		depreciation: {
			rows: [
				{
					year: 1,
					tan_factor: 50,
					tan_cumulative: 50,
					intan_factor: 100,
					intan_cumulative: 100,
				},
				{
					year: 2,
					tan_factor: 50,
					tan_cumulative: 100,
					intan_factor: 0,
					intan_cumulative: 100,
				},
			],
		},
	},
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('depreciation-model-v2', () => {
	test('up', async () => {
		await collection.insertOne({
			assumptionKey: 'depreciation',
			options: defaultDownDepreciationModelOption,
			econ_function: defaultDownDepreciationModelEconFunction,
		});
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options).toStrictEqual(defaultUpDepreciationModelOption);

		expect(doc.econ_function).toStrictEqual(defaultUpDepreciationModelEconFunction);
	});

	test('down', async () => {
		await collection.insertOne({
			assumptionKey: 'depreciation',
			options: defaultUpDepreciationModelOption,
			econ_function: defaultUpDepreciationModelEconFunction,
		});
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options).toStrictEqual(defaultDownDepreciationModelOption);

		expect(doc.econ_function).toStrictEqual(defaultDownDepreciationModelEconFunction);
	});
});
