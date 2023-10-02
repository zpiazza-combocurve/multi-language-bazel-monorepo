import { Connection, Types } from 'mongoose';

import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IProject } from '@src/models/projects';
import { ITenantInfo } from '@src/tenant';
import { REST_API_USER_ID } from '@src/constants/user';

import { ApiContextV1 } from '../context';

import { ProjectBaseService, ProjectService } from './service';
import { toApiProject } from './fields';

import { getTenantInfo } from '@test/tenant';
import projects from '@test/fixtures/projects.json';
import { TestContext } from '@test/context';

let mongoUri: string;
let connection: Connection;
let service: ProjectService;
let context: ApiContextV1;

class ProjectTestContext extends TestContext {
	readonly projectBaseService?: ProjectBaseService;

	constructor(tenant: ITenantInfo, connection: Connection) {
		super(tenant, connection);
		this.projectBaseService = new ProjectBaseService(this as unknown as ApiContextV1);
	}
}

describe('v1/projects/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new ProjectTestContext(info, connection) as ApiContextV1;
		service = new ProjectService(context);

		await context.models.ProjectModel.bulkWrite(
			projects.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);
	});
	afterAll(async () => {
		await connection.close();
	});
	test('getProjects', async () => {
		const count = await context.models.ProjectModel.countDocuments({});

		await expect(service.getProjects(0, 0, { id: 1 }, {})).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.ProjectModel.find({}).sort({ _id: 1 });
		await expect(service.getProjects(0, count + 1, { id: 1 }, {})).resolves.toStrictEqual({
			result: results.map(toApiProject),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ProjectModel.find({})
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getProjects(count - 1, 1, { id: 1 }, {})).resolves.toStrictEqual({
			result: results.map(toApiProject),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ProjectModel.find({ name: 'First' }).sort({ _id: 1 });
		await expect(service.getProjects(0, count + 1, { id: 1 }, { name: ['First'] })).resolves.toStrictEqual({
			result: results.map(toApiProject),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ProjectModel.find({}).sort({ _id: 1 }).limit(1);
		await expect(service.getProjects(0, 1, { id: 1 }, { notProjectField: ['test'] })).resolves.toStrictEqual({
			result: results.map(toApiProject),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ProjectModel.find({}).sort({ _id: 1 }).limit(1);
		await expect(service.getProjects(0, 1, { id: 1 }, {})).resolves.toStrictEqual({
			result: results.map(toApiProject),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});
	test('getProjectsCount', async () => {
		let count = await context.models.ProjectModel.countDocuments({});
		await expect(service.getProjectsCount({})).resolves.toBe(count);

		count = await context.models.ProjectModel.countDocuments({ name: 'First' });
		await expect(service.getProjectsCount({ name: ['First'] })).resolves.toBe(count);

		count = await context.models.ProjectModel.countDocuments({});
		await expect(service.getProjectsCount({ notProjectField: ['test'] })).resolves.toBe(count);
	});
	test('getById', async () => {
		await expect(service.getById(Types.ObjectId())).resolves.toBeNull();

		const project = (await context.models.ProjectModel.findOne({ _id: '5e272bed4b97ed00132f2271' })) as IProject;
		await expect(service.getById(Types.ObjectId('5e272bed4b97ed00132f2271'))).resolves.toStrictEqual(
			toApiProject(project),
		);

		await expect(service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'))).resolves.toBeNull();
	});

	test('create', async () => {
		let result = await service.create([]);
		expect(result).toStrictEqual({ results: [] });

		let projects = await context.models.ProjectModel.find({}).select('-_id').lean();
		projects = projects.map((p, index) => ({ ...p, name: `TEST-${index}`, _id: Types.ObjectId() }));
		result = await service.create(projects as IProject[]);

		const accessPolicies = await context.models.AccessPolicyModel.find({
			resourceId: { $in: projects.map(({ _id }) => _id) },
		}).lean();

		expect(accessPolicies).toStrictEqual(
			projects.map(({ _id }) => ({
				...accessPolicies.filter((a) => a.resourceId?.toString() == _id.toString())[0],
				memberType: 'users',
				memberId: Types.ObjectId(REST_API_USER_ID),
				resourceType: 'project',
				resourceId: _id,
				roles: ['project.project.admin'],
			})),
		);

		expect(result).toStrictEqual({
			results: projects.map(({ _id, name }) => ({
				status: 'Created',
				code: 201,
				id: _id.toString(),
				name,
			})),
		});
	});
});
