// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20210118193021-data-source-internal-file-imports');

let db;
let client;
let mongod;

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

const initialFileImports = [
	{
		dataPool: 'internal',
		dataSource: 'other',
		user: null,
		project: null,
		description: 'import1',
		status: 'created',
		stats: {
			totalWells: 0,
			importedWells: 0,
			foundWells: 0,
			updatedWells: 0,
			insertedWells: 0,
			totalBatches: 0,
			finishedBatches: 0,
		},
		events: [],
		errors: [],
		batchFiles: [],
		files: [],
	},
	{
		dataPool: 'external',
		dataSource: 'other',
		user: null,
		project: null,
		description: 'import2',
		status: 'created',
		stats: {
			totalWells: 0,
			importedWells: 0,
			foundWells: 0,
			updatedWells: 0,
			insertedWells: 0,
			totalBatches: 0,
			finishedBatches: 0,
		},
		events: [],
		errors: [],
		batchFiles: [],
		files: [],
	},
];

const finalFileImports = [
	{
		dataSource: 'internal',
		user: null,
		project: null,
		description: 'import1',
		status: 'created',
		stats: {
			totalWells: 0,
			importedWells: 0,
			foundWells: 0,
			updatedWells: 0,
			insertedWells: 0,
			totalBatches: 0,
			finishedBatches: 0,
		},
		events: [],
		errors: [],
		batchFiles: [],
		files: [],
	},
	{
		dataSource: 'other',
		user: null,
		project: null,
		description: 'import2',
		status: 'created',
		stats: {
			totalWells: 0,
			importedWells: 0,
			foundWells: 0,
			updatedWells: 0,
			insertedWells: 0,
			totalBatches: 0,
			finishedBatches: 0,
		},
		events: [],
		errors: [],
		batchFiles: [],
		files: [],
	},
];

describe('20210118193021-data-source-internal-file-imports', () => {
	let fileImportsCollection;

	const check = async (expectedFileImports) => {
		const fileImports = await fileImportsCollection.find().sort({ description: 1 }).toArray();
		expect(fileImports).toEqual(expectedFileImports.map(expect.objectContaining));
	};

	beforeAll(async () => {
		fileImportsCollection = db.collection('file-imports');
		await fileImportsCollection.insertMany(initialFileImports);
	});

	test('up', async () => {
		await up({ db });
		await check(finalFileImports);

		await up({ db }); // test idempotence
		await check(finalFileImports);
	});

	test('down', async () => {
		await up({ db });
		await down({ db });
		await check(initialFileImports);

		await down({ db }); // test idempotence
		await check(initialFileImports);
	});
});
