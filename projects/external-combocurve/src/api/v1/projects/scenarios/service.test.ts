import { Connection, Types } from 'mongoose';

import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IProject } from '@src/models/projects';
import { IScenario } from '@src/models/scenarios';

import { ApiContextV1 } from '../../context';
import { BaseProjectResolved } from '../fields';

import { ScenarioService } from './service';
import { toApiScenario } from './fields';

import { getTenantInfo } from '@test/tenant';
import scenarios from '@test/fixtures/scenarios.json';
import { TestContext } from '@test/context';

let mongoUri: string;
let connection: Connection;
let service: ScenarioService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let projectScopeFilter;

describe('v1/projects/:projectId/scenarios/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ScenarioService(context);

		await context.models.ScenarioModel.bulkWrite(
			scenarios.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);
	});
	afterAll(async () => {
		await connection.close();
	});
	test('getScenarios', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		const count = await context.models.ScenarioModel.countDocuments({ ...projectScopeFilter });

		await expect(service.getScenarios(0, 0, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.ScenarioModel.find({ ...projectScopeFilter }).sort({ _id: 1 });
		await expect(service.getScenarios(0, count + 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: results.map(toApiScenario),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ScenarioModel.find({ ...projectScopeFilter })
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getScenarios(count - 1, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: results.map(toApiScenario),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ScenarioModel.find({ ...projectScopeFilter })
			.sort({ name: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getScenarios(count - 1, 1, { name: -1 }, {}, project)).resolves.toStrictEqual({
			result: results.map(toApiScenario),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.ScenarioModel.find({ name: 'default1', ...projectScopeFilter }).sort({ _id: 1 });
		await expect(
			service.getScenarios(0, count + 1, { id: 1 }, { name: ['default1'] }, project),
		).resolves.toStrictEqual({
			result: results.map(toApiScenario),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ScenarioModel.find({ ...projectScopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(
			service.getScenarios(0, 1, { id: 1 }, { notScenarioField: ['test'] }, project),
		).resolves.toStrictEqual({
			result: results.map(toApiScenario),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ScenarioModel.find({ ...projectScopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(service.getScenarios(0, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: results.map(toApiScenario),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});
	test('getScenariosCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		let count = await context.models.ScenarioModel.countDocuments({ ...projectScopeFilter });
		await expect(service.getScenariosCount({}, project)).resolves.toBe(count);

		count = await context.models.ScenarioModel.countDocuments({ name: 'default1', ...projectScopeFilter });
		await expect(service.getScenariosCount({ name: ['default1'] }, project)).resolves.toBe(count);

		count = await context.models.ScenarioModel.countDocuments({ ...projectScopeFilter });
		await expect(service.getScenariosCount({ notScenarioField: ['test'] }, project)).resolves.toBe(count);
	});
	test('getById', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		await expect(
			service.getById(Types.ObjectId(), { name: 'Test Project', _id: Types.ObjectId() }),
		).resolves.toBeNull();

		const scenario = (await context.models.ScenarioModel.findOne({
			_id: '5e27305e4f59a9ec64eb576a',
			...projectScopeFilter,
		})) as IScenario;
		await expect(service.getById(Types.ObjectId('5e27305e4f59a9ec64eb576a'), project)).resolves.toStrictEqual(
			toApiScenario(scenario),
		);

		await expect(service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'), project)).resolves.toBeNull();
	});

	describe('change scenario methods', () => {
		let project: IProject;
		let scenario: IScenario;

		beforeEach(async () => {
			const projID = Types.ObjectId();

			scenario = {
				_id: Types.ObjectId(),
				name: 'Change Scenario Test Scenario' + Math.random(),
				project: projID,
			} as IScenario;

			project = {
				_id: projID,
				name: 'Change Scenario Test Project' + Math.random(),
				scenarios: [scenario._id],
			} as IProject;

			await context.models.ProjectModel.create(project);
			await context.models.ScenarioModel.create(scenario);
		});

		it('upsertScenario should add and update', async () => {
			// upsertScenario should:
			//   1. add a new scenario
			//   2. update an existing scenario
			//   3. add the new scenario to the project's scenarios array

			const apiInput = [
				{
					name: 'insert new scenario',
				},
				{
					id: scenario._id,
					name: 'updated existing scenario',
				},
			];

			// Act
			const output = await service.upsertScenarios(project._id, apiInput);

			// Assert
			const dbProject = await context.models.ProjectModel.findById(project._id);
			const dbScenarios = await context.models.ScenarioModel.find({ project: project._id });

			expect(dbScenarios).toHaveLength(2);

			const updatedScenario = dbScenarios.find((s: IScenario) => s._id.equals(scenario._id));
			const newScenario = dbScenarios.find((s: IScenario) => !s._id.equals(scenario._id));

			expect(updatedScenario?.name).toBe('updated existing scenario');
			expect(newScenario?.name).toBe('insert new scenario');

			expect(dbProject).toBeDefined();
			expect(dbProject?.scenarios).toHaveLength(2);
			expect(dbProject?.scenarios.includes(newScenario?._id ?? new Types.ObjectId())).toBeTruthy();

			expect(output).toStrictEqual({
				failedCount: 0,
				successCount: 2,
				results: [
					{
						status: 'Created',
						code: 201,
						id: newScenario?._id,
					},
					{
						status: 'Updated',
						code: 204,
						id: updatedScenario?._id,
					},
				],
			});
		});

		it('deleteScenarios should delete scenario by name and id', async () => {
			const name = 'deleteScenarios' + Math.random();
			await context.models.ScenarioModel.create({
				_id: Types.ObjectId(),
				name: name,
				project: project._id,
			});

			const filters = {
				name: [name],
				id: [scenario._id.toHexString()],
			};

			// Act
			const output = await service.deleteScenarios(project._id, filters as unknown as ApiQueryFilters);

			expect(output).toBe(2);

			const dbProject = await context.models.ProjectModel.findById(project._id);
			const dbScenarios = await context.models.ScenarioModel.find({ project: project._id });

			expect(dbScenarios).toHaveLength(0);
			expect(dbProject?.scenarios).toHaveLength(0);
		});
	});
});
