/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Connection, Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IBaseEconModel } from '@src/models/econ/econ-models';
import { IScenario } from '@src/models/scenarios';
import { IScenarioWellAssignments } from '@src/models/scenario-well-assignments';

import { testCreateScenario } from '../test.exports';

import { ScenarioWellsService } from './service';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/cloud-caller');

describe('qualifiers service', () => {
	let context: ApiContextV1;
	let connection: Connection;
	let service: ScenarioWellsService;

	async function addScenario(wells: Types.ObjectId[] = []): Promise<IScenario> {
		const scenario = testCreateScenario();
		scenario._id = Types.ObjectId();
		scenario.project = Types.ObjectId();
		scenario.wells = [...scenario.wells, ...wells];

		const output = await context.models.ScenarioModel.insertMany([scenario], { lean: true });
		return output[0];
	}

	beforeAll(async () => {
		const uri = await getMemoryMongoUri();

		const info = await getTenantInfo(uri);
		connection = await connectToDb(uri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ScenarioWellsService(context);

		// default scenario
		await context.models.ScenarioModel.insertMany([testCreateScenario()], { lean: true });
	});

	afterAll(async () => {
		await connection.close();
	});

	describe('getScenarioWells method', () => {
		it('should return scenario when exists', async () => {
			const scenario = testCreateScenario();

			const result = await service.getScenarioWells(scenario._id, scenario.project);
			expect(result).toBeDefined();
		});

		it('should return null when not found', async () => {
			const result = await service.getScenarioWells(
				Types.ObjectId.createFromTime(1),
				Types.ObjectId.createFromTime(2),
			);

			expect(result).toBeNull();
		});
	});

	describe('getWellsAndProject method', () => {
		let scenario: IScenario;
		let wells: Types.ObjectId[];

		beforeAll(async () => {
			scenario = testCreateScenario();
			wells = Array.from({ length: 100 }).map((_, i) => Types.ObjectId.createFromTime(1000 + i));

			await context.models.ProjectModel.create({
				_id: scenario.project,
				name: 'test_scenario_wells',
				wells: wells,
			});
		});

		it('should get all project wells', async () => {
			const got = await service.getProjectWells(scenario.project);

			expect(got).toHaveLength(100);
		});
	});

	it('updateScenarioWells method should update scenario with new wells AND create the scenario-wells records', async () => {
		const scenario = await addScenario();

		// Update It
		const wells = Array.from({ length: 100 }).map((_, i) => Types.ObjectId.createFromTime(i));
		await service.updateScenarioWells(scenario._id, scenario.project, wells);

		// Check It
		const got = await service.getScenarioWells(scenario._id, scenario.project);

		// This scenario has 3 wells by default
		expect(got?.wells).toHaveLength(103);

		// The assign collection does not have these 3 default scenario wells
		const assignments = await context.models.ScenarioWellAssignmentsModel.find({ scenario: scenario._id });
		expect(assignments).toHaveLength(100);
	});

	describe('unassignWells method', () => {
		it('should delete everything as expected', async () => {
			const wellID = new Types.ObjectId();
			const scenario = await addScenario([wellID]);

			await context.models.AssumptionModel.insertMany([
				{
					_id: Types.ObjectId(),
					assumptionName: 'test',
					assumptionKey: 'capex',
					options: {},
					econ_function: {},
					unique: false,
					scenario: scenario._id,
					project: scenario.project,
					well: wellID,
					name: 'test',
				} as unknown as IBaseEconModel,
			]);

			await context.models.ScenarioWellAssignmentsModel.insertMany([
				{
					_id: Types.ObjectId(),
					scenario: scenario._id,
					project: scenario.project,
					well: wellID,
				} as unknown as IScenarioWellAssignments,
			]);

			const got = await service.unassignWells(scenario._id, [wellID]);
			expect(got).toBeTruthy();

			const checkScenario = await context.models.ScenarioModel.findById(scenario._id);

			expect(checkScenario).toBeDefined();
			expect(checkScenario!.wells).toHaveLength(scenario.wells.length - 1);
			expect(checkScenario!.wells).not.toContain(wellID);

			const checkAssumptions = await context.models.AssumptionModel.find({ well: wellID });
			expect(checkAssumptions).toHaveLength(0);

			const checkAssignments = await context.models.ScenarioWellAssignmentsModel.find({ well: wellID });
			expect(checkAssignments).toHaveLength(0);
		});
	});
});
