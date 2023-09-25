// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210331000407-update-cutoff');

let collection;
let db;
let mongod;
let client;

const noCutOff = {
	criteria: {
		label: 'No Cut Off',
		value: 'no_cut_off',
		staticValue: '',
		fieldType: 'static',
		fieldName: 'No Cut Off',
	},
	value: '',
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210331000407-update-cutoff', () => {
	test('up', async () => {
		await collection.insertOne({
			assumptionKey: 'dates',
			options: {
				cut_off: noCutOff,
			},
			econ_function: { cut_off: { no_cut_off: '' } },
		});
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.cut_off.include_capex).toStrictEqual({ label: 'No', value: 'no' });
		expect(doc.options.cut_off.discount).toEqual(0);
		expect(doc.options.cut_off.econ_limit_delay).toEqual(0);

		expect(doc.econ_function.cut_off.include_capex).toEqual('no');
		expect(doc.econ_function.cut_off.discount).toEqual(0);
		expect(doc.econ_function.cut_off.econ_limit_delay).toEqual(0);
	});

	test('down', async () => {
		await collection.insertOne({
			assumptionKey: 'dates',
			options: {
				cut_off: {
					cut_off: noCutOff,
					include_capex: {
						label: 'No',
						value: 'no',
					},
					discount: 0,
					econ_limit_delay: 0,
				},
			},
			econ_function: {
				cut_off: {
					no_cut_off: '',
					include_capex: 'no',
					discount: 0,
					econ_limit_delay: 0,
				},
			},
		});
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.cut_off).not.toHaveProperty('include_capex');
		expect(doc.options.cut_off).not.toHaveProperty('discount');
		expect(doc.options.cut_off).not.toHaveProperty('econ_limit_delay');

		expect(doc.econ_function.cut_off).not.toHaveProperty('include_capex');
		expect(doc.econ_function.cut_off).not.toHaveProperty('discount');
		expect(doc.econ_function.cut_off).not.toHaveProperty('econ_limit_delay');
	});
});
