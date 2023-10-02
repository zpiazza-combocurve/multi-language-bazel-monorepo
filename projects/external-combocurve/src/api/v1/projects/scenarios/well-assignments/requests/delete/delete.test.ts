/* eslint-disable 
	@typescript-eslint/no-explicit-any */

import { ApiContextV1 } from '@src/api/v1/context';
import { HttpMessageContext } from '@src/core/common';
import { IScenario } from '@src/models/scenarios';

import { ScenarioWellsService } from '../../service';
import { testCreateScenario } from '../../../test.exports';

import { ScenarioWellsDelete } from './delete';

import { mockExpress } from '@test/express-mocks';

jest.mock('@src/helpers/request');

const createService = (scenarioMock?: IScenario, deleteMock?: boolean): ScenarioWellsService => {
	const output = new ScenarioWellsService({} as ApiContextV1);

	output.getScenarioWells = jest.fn().mockResolvedValue(scenarioMock);
	output.unassignWells = jest.fn().mockResolvedValue(deleteMock);

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

describe('ScenarioWellsDelete', () => {
	describe('handle method', () => {
		it('should set response as not found when not found scenario', async () => {
			const req = new ScenarioWellsDelete();
			const msg = createHttpMessage();

			req.scenarioWellsService = createService();
			await req.handle(msg);

			expect(msg.response.statusCode).toBe(404);
		});

		async function deleteHandle(mockIsDeleted: boolean): Promise<number | undefined> {
			const req = new ScenarioWellsDelete();
			const msg = createHttpMessage();
			const scenario = testCreateScenario();

			req.scenarioWellsService = createService(scenario, mockIsDeleted);
			req.wells = scenario.wells;

			return await req.handle(msg);
		}

		it('should delete as expected', async () => {
			const scenario = testCreateScenario();
			const deleteCount = await deleteHandle(true);

			expect(deleteCount).toBe(scenario.wells.length);
		});

		it('should return zero when service not delete correctly', async () => {
			const deleteCount = await deleteHandle(false);
			expect(deleteCount).toBe(0);
		});
	});
});
