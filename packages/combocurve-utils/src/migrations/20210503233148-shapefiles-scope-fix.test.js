// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210503233148-shapefiles-scope-fix');

let collection;
let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	collection = db.collection('shapefiles');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210503233148-shapefiles-scope-fix', () => {
	test('up', async () => {
		const correctProjectScoped = {
			_id: new ObjectId(),
			visibility: ['project'],
			projectIds: [new ObjectId().toString()],
		};
		const correctCompanyScoped1 = {
			_id: new ObjectId(),
			visibility: ['company'],
			projectIds: [new ObjectId().toString()],
		};
		const correctCompanyScoped2 = { _id: new ObjectId(), visibility: ['company'], projectIds: null };
		const projectScopedNoProjects = { _id: new ObjectId(), visibility: ['project'], projectIds: null };

		const projectScopedNoProjectsFixed = {
			_id: projectScopedNoProjects._id,
			visibility: ['company'],
			projectIds: null,
		};

		await collection.insertMany([
			correctProjectScoped,
			correctCompanyScoped1,
			correctCompanyScoped2,
			projectScopedNoProjects,
		]);

		await up({ db });

		await Promise.all(
			[correctProjectScoped, correctCompanyScoped1, correctCompanyScoped2, projectScopedNoProjectsFixed].map(
				async (shapefile) => {
					const res = await collection.findOne({ _id: shapefile._id });
					expect(res).toEqual(shapefile);
				}
			)
		);

		await up({ db }); // test idempotence

		await Promise.all(
			[correctProjectScoped, correctCompanyScoped1, correctCompanyScoped2, projectScopedNoProjectsFixed].map(
				async (shapefile) => {
					const res = await collection.findOne({ _id: shapefile._id });
					expect(res).toEqual(shapefile);
				}
			)
		);
	});
});
