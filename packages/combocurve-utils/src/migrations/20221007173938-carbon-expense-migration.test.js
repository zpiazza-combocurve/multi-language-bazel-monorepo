// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

const {
	up,
	down,
	carbonExpenseOption,
	carbonExpenseEconFunction,
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
} = require('./20221007173938-carbon-expense-migration');

const carbonExpenseOptionExpected = JSON.parse(JSON.stringify(carbonExpenseOption));
const carbonExpenseEconFunctionExpected = JSON.parse(JSON.stringify(carbonExpenseEconFunction));

Object.entries(carbonExpenseOptionExpected).forEach((entry) => {
	const [key, value] = entry;
	if (key === 'category') {
		return;
	}
	value.subItems.row_view.headers.carbon_expense = '$/MT';
});

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('assumptions');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('carbon-expense-migration', () => {
	test('up', async () => {
		await collection.insertOne({
			assumptionKey: 'expenses',
		});
		await up({ db });
		await up({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options.carbon_expenses).toStrictEqual(carbonExpenseOptionExpected);

		expect(doc.econ_function.carbon_expenses).toStrictEqual(carbonExpenseEconFunctionExpected);
	});

	test('down', async () => {
		await collection.insertOne({
			assumptionKey: 'expenses',
			options: { carbon_expenses: { carbonExpenseOptionExpected } },
			econ_function: { carbon_expenses: { carbonExpenseEconFunctionExpected } },
		});
		await down({ db });
		await down({ db }); // test idempotence

		const doc = await collection.findOne();

		expect(doc.options).toStrictEqual({});
	});
});
