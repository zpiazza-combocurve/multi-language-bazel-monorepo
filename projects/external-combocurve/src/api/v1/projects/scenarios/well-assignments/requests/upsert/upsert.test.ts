/* eslint-disable 
	@typescript-eslint/no-explicit-any */

import { Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { HttpMessageContext } from '@src/core/common';
import { IScenario } from '@src/models/scenarios';

import { ScenarioWellsService } from '../../service';
import { testCreateScenario } from '../../../test.exports';

import { ScenarioWellsUpsert } from './upsert';

import { mockExpress } from '@test/express-mocks';

jest.mock('@src/helpers/request');

const createService = (scenarioMock?: IScenario, projectWells?: Types.ObjectId[]): ScenarioWellsService => {
	const output = new ScenarioWellsService({} as ApiContextV1);

	output.getScenarioWells = jest.fn().mockResolvedValue(scenarioMock);
	output.getProjectWells = jest.fn().mockResolvedValue(projectWells);
	output.updateScenarioWells = jest.fn();

	return output;
};

const createHttpMessage = (): HttpMessageContext => {
	const { req, res } = mockExpress();

	res.status = (code: number) => {
		res.statusCode = code;
		return res;
	};

	res.json = jest.fn().mockReturnValue(res.end);

	return {
		request: req,
		response: res,
	} as HttpMessageContext;
};

describe('ScenarioWellsUpsert', () => {
	describe('handle method', () => {
		it('should set response as not found when not found scenario', async () => {
			const req = new ScenarioWellsUpsert();
			const msg = createHttpMessage();

			req.scenarioWellsService = createService();
			await req.handle(msg);

			expect(msg.response.statusCode).toBe(404);
		});

		it('should set response as BadRequest when wells exceeds the limit', async () => {
			const req = new ScenarioWellsUpsert();
			const limit = ScenarioWellsService.maxWellsPerScenario;

			req.wells = Array.from({ length: limit }).map((_, idx) => Types.ObjectId.createFromTime(idx));

			req.scenarioWellsService = createService(testCreateScenario(), req.wells);

			const msg = createHttpMessage();
			await req.handle(msg);

			expect(msg.response.statusCode).toBe(400);
			expect(msg.response.json).toHaveBeenCalledWith({
				status: 'BadRequest',
				code: 400,
				message: `The number of wells in scenario exceeds the limit of ${limit}`,
			});
		});

		it('should return correct result as expected', async () => {
			const req = new ScenarioWellsUpsert();
			req.wells = [Types.ObjectId.createFromTime(1)];

			req.scenarioWellsService = createService(testCreateScenario(), req.wells);

			const msg = createHttpMessage();
			const got = await req.handle(msg);

			expect(got).toStrictEqual({
				results: [
					{
						code: 201,
						status: 'Created',
						chosenID: req.wells[0].toHexString(),
					},
				],
			});
		});
	});

	describe('addWells method', () => {
		it('should return empty array when wells undefined', async () => {
			const req = new ScenarioWellsUpsert();
			const got = req.addWells(new Set<string>(), new Set<string>(), []);

			expect(got).toEqual([]);
		});

		it('should return NotFound when well not exists', async () => {
			const req = new ScenarioWellsUpsert();
			req.wells = [Types.ObjectId('5f8f8d3a3d5d9d1d7c4b1b1a')];

			const got = req.addWells(new Set<string>(), new Set<string>(), []);

			expect(got).toStrictEqual([
				{
					code: 404,
					status: 'NotFound',
					chosenID: '5f8f8d3a3d5d9d1d7c4b1b1a',
				},
			]);
		});

		it('should not add well again when scenario hash contains it', async () => {
			const req = new ScenarioWellsUpsert();

			req.wells = [Types.ObjectId('123f8d3a3d5d9d1d7c4b1123')];
			req.projectId = Types.ObjectId('456f8d3a3d5d9d1d7c4b1456');

			const scenarioWells: Types.ObjectId[] = [];
			const got = req.addWells(
				new Set<string>(['123f8d3a3d5d9d1d7c4b1123']),
				new Set<string>(['123f8d3a3d5d9d1d7c4b1123']),
				[],
			);

			expect(scenarioWells).toStrictEqual([]);
			expect(got).toStrictEqual([
				{
					code: 201,
					status: 'Created',
					chosenID: '123f8d3a3d5d9d1d7c4b1123',
				},
			]);
		});

		it('should add well when scenario hash does not contains it', async () => {
			const req = new ScenarioWellsUpsert();

			req.wells = [Types.ObjectId('123f8d3a3d5d9d1d7c4b1123')];
			req.projectId = Types.ObjectId('456f8d3a3d5d9d1d7c4b1456');

			const scenarioHash = new Set<string>();

			const got = req.addWells(scenarioHash, new Set<string>(['123f8d3a3d5d9d1d7c4b1123']), req.wells);

			expect([...scenarioHash]).toStrictEqual(['123f8d3a3d5d9d1d7c4b1123']);
			expect(got).toStrictEqual([
				{
					code: 201,
					status: 'Created',
					chosenID: '123f8d3a3d5d9d1d7c4b1123',
				},
			]);
		});
	});
});
