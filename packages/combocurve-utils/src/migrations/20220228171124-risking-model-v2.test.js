// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20220228171124-risking-model-v2');

let collection;
let db;
let mongod;
let client;

const defaultPhaseRiskingOptions = {
	subItems: {
		row_view: {
			headers: {
				multiplier: 'Multiplier',
				criteria: {
					label: 'Flat',
					value: 'entire_well_life',
				},
			},
			rows: [
				{
					multiplier: 100,
					criteria: 'Flat',
				},
			],
		},
	},
};

const defaultPhaseRiskingEconFunc = {
	rows: [
		{
			multiplier: 100,
			entire_well_life: 'Flat',
		},
	],
};

const defaultRiskProd = {
	label: 'No',
	value: 'no',
	disabled: false,
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20220228171124-risking-model-v2', () => {
	test('up', async () => {
		await collection.insertOne({
			assumptionKey: 'risking',
			options: {
				risking_model: {
					risk_prod: defaultRiskProd,
					volume_multiplier: {
						subItems: {
							oil: 100,
							gas: 100,
							ngl: 100,
							drip_condensate: 100,
							water: 100,
						},
					},
				},
			},
			econ_function: {
				risking_model: {
					risk_prod: 'no',
					volume_multiplier: {
						oil: 100,
						gas: 100,
						ngl: 100,
						drip_condensate: 100,
						water: 100,
					},
				},
			},
		});
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.risking_model).toStrictEqual({
			risk_prod: defaultRiskProd,
			oil: defaultPhaseRiskingOptions,
			gas: defaultPhaseRiskingOptions,
			ngl: defaultPhaseRiskingOptions,
			drip_condensate: defaultPhaseRiskingOptions,
			water: defaultPhaseRiskingOptions,
		});

		expect(doc.econ_function.risking_model).toStrictEqual({
			risk_prod: 'no',
			oil: defaultPhaseRiskingEconFunc,
			gas: defaultPhaseRiskingEconFunc,
			ngl: defaultPhaseRiskingEconFunc,
			drip_condensate: defaultPhaseRiskingEconFunc,
			water: defaultPhaseRiskingEconFunc,
		});
	});

	test('down', async () => {
		await collection.insertOne({
			assumptionKey: 'risking',
			options: {
				risking_model: {
					risk_prod: defaultRiskProd,
					oil: defaultPhaseRiskingOptions,
					gas: defaultPhaseRiskingOptions,
					ngl: defaultPhaseRiskingOptions,
					drip_condensate: defaultPhaseRiskingOptions,
					water: defaultPhaseRiskingOptions,
				},
			},
			econ_function: {
				risking_model: {
					risk_prod: 'no',
					oil: defaultPhaseRiskingEconFunc,
					gas: defaultPhaseRiskingEconFunc,
					ngl: defaultPhaseRiskingEconFunc,
					drip_condensate: defaultPhaseRiskingEconFunc,
					water: defaultPhaseRiskingEconFunc,
				},
			},
		});
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.risking_model).toStrictEqual({
			risk_prod: defaultRiskProd,
			volume_multiplier: {
				subItems: {
					oil: 100,
					gas: 100,
					ngl: 100,
					drip_condensate: 100,
					water: 100,
				},
			},
		});

		expect(doc.econ_function.risking_model).toStrictEqual({
			risk_prod: 'no',
			volume_multiplier: {
				oil: 100,
				gas: 100,
				ngl: 100,
				drip_condensate: 100,
				water: 100,
			},
		});
	});
});
