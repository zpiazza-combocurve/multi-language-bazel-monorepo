// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210602225052-make-creator-a-project-admin');

let db;
let mongod;
let client;

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210602225052-make-creator-a-project-admin', () => {
	test('user does not have any roles', async () => {
		await db.collection('projects').insertOne({
			createdBy: 'test',
		});

		await up({ db });

		const accessPolicies = await db.collection('access-policies').find().toArray();

		expect(accessPolicies[0].memberId).toEqual('test');
		expect(accessPolicies[0].roles).toEqual(['project.project.admin']);
	});

	test('user already has a role', async () => {
		await db.collection('projects').insertOne({
			createdBy: 'test',
		});

		const project = await db.collection('projects').findOne({}, { _id: 1 });

		await db.collection('access-policies').insertOne({
			memberType: 'users',
			memberId: 'test',
			resourceType: 'project',
			resourceId: project._id,
			roles: ['project.project.viewer'],
		});

		await up({ db });

		const accessPolicies = await db.collection('access-policies').find().toArray();

		expect(accessPolicies[0].memberId).toEqual('test');
		expect(accessPolicies[0].roles).toEqual(['project.project.viewer', 'project.project.admin']);
	});
});
