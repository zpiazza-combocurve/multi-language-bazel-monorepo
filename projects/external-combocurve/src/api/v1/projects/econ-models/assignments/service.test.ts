/* eslint-disable 
	@typescript-eslint/no-explicit-any,
	@typescript-eslint/no-non-null-assertion */

import { Connection, Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IScenario } from '@src/models/scenarios';
import { ValidationError } from '@src/helpers/validation';

import { testCreateScenario, testCreateWellAssingment } from '../../scenarios/test.exports';

import { EconModelAssignmentService } from './service';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/cloud-caller');

describe('EconModelAssignment service', () => {
	let context: ApiContextV1;
	let connection: Connection;
	let service: EconModelAssignmentService;
	let econModelId: Types.ObjectId;
	let scenarioId: Types.ObjectId;
	let assignId: Types.ObjectId;
	let projId: Types.ObjectId;

	async function addScenario(scenario: IScenario): Promise<IScenario[]> {
		const output = await context.models.ScenarioModel.insertMany([scenario], { lean: true });
		return output;
	}

	beforeAll(async () => {
		const mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);

		context = new TestContext(info, connection) as ApiContextV1;
		service = new EconModelAssignmentService(context);

		projId = Types.ObjectId();
		econModelId = Types.ObjectId();
		assignId = Types.ObjectId();
		scenarioId = Types.ObjectId();

		const scenario = testCreateScenario();
		const assign = testCreateWellAssingment(econModelId);

		scenario.project = projId;
		scenario._id = scenarioId;
		assign._id = assignId;
		assign.scenario = scenarioId;
		assign.project = projId;

		// default scenario
		await addScenario(scenario);
		await context.models.ScenarioWellAssignmentsModel.insertMany([assign], { lean: true });
	});

	afterAll(async () => {
		await connection.close();
	});

	describe('checkEconModel method', () => {
		it('should return error when econ is general_options', async () => {
			context.econModelService.getEconKeyById = jest.fn().mockResolvedValue(undefined);

			const id = Types.ObjectId();
			const result = await service.checkEconModel(id, 'general_options');

			expect(result).toStrictEqual(
				new ValidationError(`The econ General Options can't be assigned to a well.`, 'url', 'InvalidEconName'),
			);
		});

		it('should return econ error when not find econ', async () => {
			context.econModelService.getEconKeyById = jest.fn().mockResolvedValue(undefined);

			const id = Types.ObjectId();
			const result = await service.checkEconModel(id, 'test');

			expect(result).toStrictEqual(
				new ValidationError(`The econModel '${id}' is not 'test'`, 'url', 'EconTypeMismatch'),
			);
		});

		it('should return econ error when name not match', async () => {
			context.econModelService.getEconKeyById = jest.fn().mockResolvedValue('test_2');

			const id = Types.ObjectId();
			const result = await service.checkEconModel(id, 'test');

			expect(result).toStrictEqual(
				new ValidationError(`The econModel '${id}' is not 'test'`, 'url', 'EconTypeMismatch'),
			);
		});
	});

	it('getAllEconModelAssignments method should return all of the 3 qualifiers registered to AF econModel', async () => {
		const econName = 'production_vs_fit';

		const result = await service.getPageEconModelAssignments(projId, econModelId, econName, 0, 100, { _id: 1 });

		expect(result.items).toStrictEqual([
			{
				qualifierKey: 'qualifier1',
				scenario: scenarioId,
				well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			},
			{
				qualifierKey: 'qualifier2',
				scenario: scenarioId,
				well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			},
			{
				qualifierKey: 'qualifier3',
				scenario: scenarioId,
				well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			},
		]);
	});

	it('assignWellsToEcon method should assing the econModel to senarioWell', async () => {
		const econName = 'capex';

		const expectToOldModel = [
			{
				qualifierKey: 'default',
				scenario: scenarioId,
				well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			},
			{
				qualifierKey: 'qualifier1',
				scenario: scenarioId,
				well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			},
		];

		// Checking current state
		let result = await service.getPageEconModelAssignments(projId, econModelId, econName, 0, 100, { _id: 1 });
		expect(result.items).toStrictEqual(expectToOldModel);

		// Adding a new one
		const newModel = Types.ObjectId();
		await service.assignWellsToEcon(scenarioId, 'qualifier2', 'capex', newModel);

		// Checking if last state still correct
		result = await service.getPageEconModelAssignments(projId, econModelId, econName, 0, 100, { _id: 1 });
		expect(result.items).toStrictEqual(expectToOldModel);

		// Checking if new assignment
		const newAssingment = await service.getPageEconModelAssignments(projId, newModel, econName, 0, 100, { _id: 1 });
		expect(newAssingment.items).toStrictEqual([
			{
				qualifierKey: 'qualifier2',
				scenario: scenarioId,
				well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			},
		]);
	});

	it('removeEconFromWells method should remove econModel from ScenarioWell', async () => {
		const econName = 'expenses';

		const expectToOldModel = [
			{
				qualifierKey: 'default',
				scenario: scenarioId,
				well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			},
			{
				qualifierKey: 'qualifier1',
				scenario: scenarioId,
				well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			},
			{
				qualifierKey: 'qualifier2',
				scenario: scenarioId,
				well: Types.ObjectId('5f9d7a3b9d5f9d7a3b9d6565'),
			},
		];

		// Checking current state
		let result = await service.getPageEconModelAssignments(projId, econModelId, econName, 0, 100, { _id: 1 });
		expect(result.items).toStrictEqual(expectToOldModel);

		// removing qualifier 2
		await service.removeEconFromWells(scenarioId, 'qualifier2', 'expenses');

		// Checking new state
		result = await service.getPageEconModelAssignments(projId, econModelId, econName, 0, 100, { _id: 1 });
		expect(result.items).toStrictEqual(expectToOldModel.slice(0, 2));
	});
});
