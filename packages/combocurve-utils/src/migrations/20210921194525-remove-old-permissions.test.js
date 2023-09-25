// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210921194525-remove-old-permissions');

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

describe('20210921194525-remove-old-permissions', () => {
	let projectCollection;
	let userCollection;

	beforeAll(async () => {
		projectCollection = db.collection('projects');
		userCollection = db.collection('users');

		await projectCollection.insertMany([
			{
				name: 'project 1',
			},
			{
				name: 'project 2',
				perms: [],
			},
		]);
		await userCollection.insertMany([
			{
				name: 'user 1',
			},
			{
				name: 'user 2',
				role: 'role',
				displayRole: 'displayRole',
				inActive: false,
			},
		]);
	});

	test('up', async () => {
		await up({ db });
		await up({ db });

		const projectsCount = await projectCollection.countDocuments({});
		expect(projectsCount).toEqual(2);

		const usersCount = await userCollection.countDocuments({});
		expect(usersCount).toEqual(2);

		const project2 = await projectCollection.find({ name: 'project 2' });
		expect(project2).not.toHaveProperty('perms');

		const user2 = await userCollection.find({ name: 'user 2' });
		expect(user2).not.toHaveProperty('role');
		expect(user2).not.toHaveProperty('displayRole');
		expect(user2).not.toHaveProperty('inActive');
	});
});
