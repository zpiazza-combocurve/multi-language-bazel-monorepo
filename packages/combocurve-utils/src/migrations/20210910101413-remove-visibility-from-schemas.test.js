// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210910101413-remove-visibility-from-schemas');

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

describe('20210910101413-remove-visibility-from-schemas', () => {
	let typeCurvesCollection;
	let scenariosCollection;
	let projectsCollection;
	let forecastsCollection;
	let assumptionsCollection;
	let archivedProjectsCollection;

	const testData = [
		{
			_id: '5e41b49612f61e0012dfa851',
			visibility: 'project',
		},
		{
			_id: '5e41b49612f61e0012dfa852',
			visibility: 'company',
		},
		{
			_id: '5e41b49612f61e0012dfa853',
			visibility: 'user',
		},
	];

	beforeAll(async () => {
		typeCurvesCollection = db.collection('type-curves');
		scenariosCollection = db.collection('scenarios');
		projectsCollection = db.collection('projects');
		forecastsCollection = db.collection('forecasts');
		assumptionsCollection = db.collection('assumptions');
		archivedProjectsCollection = db.collection('archived-projects');

		await typeCurvesCollection.insertMany([...testData]);
		await scenariosCollection.insertMany([...testData]);
		await projectsCollection.insertMany([...testData]);
		await forecastsCollection.insertMany([...testData]);
		await assumptionsCollection.insertMany([...testData]);
		await archivedProjectsCollection.insertMany([...testData]);
	});

	test('up', async () => {
		await up({ db });

		const document = { visibility: { $exists: true } };

		expect(await typeCurvesCollection.find(document).toArray()).toStrictEqual([]);
		expect(await scenariosCollection.find(document).toArray()).toStrictEqual([]);
		expect(await projectsCollection.find(document).toArray()).toStrictEqual([]);
		expect(await forecastsCollection.find(document).toArray()).toStrictEqual([]);
		expect(await assumptionsCollection.find(document).toArray()).toStrictEqual([]);
		expect(await archivedProjectsCollection.find(document).toArray()).toStrictEqual([]);
	});
});
