/* eslint-disable 
	@typescript-eslint/no-explicit-any,
	@typescript-eslint/no-non-null-assertion */

import { Connection, Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IScenario } from '@src/models/scenarios';

import { testCreateScenario, testScenarioResponse } from '../test.exports';

import { QualifiersService } from './service';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/cloud-caller');

describe('qualifiers service', () => {
	let context: ApiContextV1;
	let connection: Connection;
	let service: QualifiersService;
	let scenario: IScenario;

	async function addScenario(scenario: IScenario): Promise<IScenario[]> {
		const output = await context.models.ScenarioModel.insertMany([scenario], { lean: true });
		return output;
	}

	beforeAll(async () => {
		const mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new QualifiersService(context);

		scenario = testCreateScenario();

		scenario._id = Types.ObjectId();
		scenario.project = Types.ObjectId();

		// default scenario
		await addScenario(scenario);
	});

	afterAll(async () => {
		await connection.close();
	});

	describe('getScenarioWithOnlyQualifiers method', () => {
		it('should return scenario when exists', async () => {
			const result = await service.getScenarioWithOnlyQualifiers(scenario.id, scenario.project);
			expect(result).toBeDefined();
		});

		it('should return null when not found', async () => {
			const result = await service.getScenarioWithOnlyQualifiers(
				Types.ObjectId.createFromTime(1),
				Types.ObjectId.createFromTime(2),
			);

			expect(result).toBeNull();
		});
	});

	describe('parseScenarioToResponse method', () => {
		it('should parse all models when filteredEcons is undefined', async () => {
			const result = await service.parseScenarioToResponse(scenario);
			expect(result).toStrictEqual(testScenarioResponse);
		});

		it('should return empty when filteredEcons is empty', async () => {
			const result = await service.parseScenarioToResponse(scenario, []);
			expect(result).toStrictEqual({});
		});

		it('should parse only filtered econs when present', async () => {
			const result = await service.parseScenarioToResponse(scenario, ['capex']);
			expect(result).toStrictEqual({ capex: testScenarioResponse.capex });
		});
	});

	describe('getAllEconQualifierFromScenario method', () => {
		it('should get all of the capex qualifiers', async () => {
			const capex = 'capex';

			const result = service.getAllEconQualifierFromScenario(capex, scenario);
			expect(result).toStrictEqual((scenario as any).columns.capex.qualifiers);
		});
	});

	describe('getActiveEconQualifierFromScenario method', () => {
		it('should get the capex active qualifier', async () => {
			const capex = 'capex';

			const result = service.getActiveEconQualifierFromScenario(capex, scenario);
			expect(result).toStrictEqual((scenario as any).columns.capex.activeQualifier);
		});
	});

	describe('updateScenarioQualifiers method', () => {
		it('should update the affected econModels', async () => {
			const savedScenario = await service.getScenarioWithOnlyQualifiers(scenario._id, scenario.project);

			const anySaved = savedScenario as any;

			anySaved.columns.capex.qualifiers = {
				default: { name: 'Default' },
				qualifier1: { name: 'capex' },
				qualifier2: { name: 'capex_2' },
			};

			anySaved.columns.expenses.qualifiers = {
				default: { name: 'Default' },
			};

			await service.updateScenarioQualifiers(savedScenario!, ['capex']);
			const updatedScenario = await service.getScenarioWithOnlyQualifiers(scenario._id, scenario.project);
			const anyUpdated = updatedScenario as any;

			expect(anyUpdated.columns.capex.qualifiers).toStrictEqual(anySaved.columns.capex.qualifiers);
			expect(Object.keys(anyUpdated.columns.expenses.qualifiers)).toStrictEqual([
				'default',
				'qualifier1',
				'qualifier2',
			]);
		});
	});
});
