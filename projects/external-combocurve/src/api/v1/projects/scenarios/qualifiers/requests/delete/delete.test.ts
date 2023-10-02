/* eslint-disable 
	@typescript-eslint/no-explicit-any */

import { ApiContextV1 } from '@src/api/v1/context';
import { EconName } from '@src/value-objects/econ-name';
import { HttpMessageContext } from '@src/core/common';
import { IScenario } from '@src/models/scenarios';

import { QualifiersService } from '../../service';
import { testCreateScenario } from '../../../test.exports';

import { QualifiersDelete } from './delete';

import { mockExpress } from '@test/express-mocks';

jest.mock('@src/helpers/request');

const createQualifierService = (scenarioMock?: IScenario): QualifiersService => {
	const output = new QualifiersService({} as ApiContextV1);

	output.getScenarioWithOnlyQualifiers = jest.fn().mockResolvedValue(scenarioMock);
	output.deleteScenarioQualifiers = jest.fn();

	return output;
};

const createHttpMessage = (): HttpMessageContext => {
	const { req, res } = mockExpress();

	res.json = jest.fn().mockReturnValue(res.end);

	return {
		request: req,
		response: res,
	} as HttpMessageContext;
};

describe('qualifiers delete request', () => {
	describe('removeQualifier method', () => {
		it('when exists should remove as expected', () => {
			const req = new QualifiersDelete();
			const scenario = testCreateScenario() as any;
			const expenses = scenario.columns.expenses.qualifiers as any;

			req.removeQualifier(expenses, 'expenses_2');
			expect(Object.keys(expenses)).toStrictEqual(['default', 'qualifier1']);

			req.removeQualifier(expenses, 'expenses');
			expect(Object.keys(expenses)).toStrictEqual(['default']);

			req.removeQualifier(expenses, 'Default');
			expect(Object.keys(expenses)).toStrictEqual(['default']);
		});
	});

	describe('handle method', () => {
		it('should set response as not found when not found scenario', async () => {
			const req = new QualifiersDelete();
			const msg = createHttpMessage();

			req.qualifiersService = createQualifierService();
			await req.handle(msg);

			expect(msg.response.statusCode).toBe(404);
		});

		it('should not allow to delete the active qualifier', async () => {
			const req = new QualifiersDelete();
			const msg = createHttpMessage();

			req.qualifierNames = ['production_vs_fit_3'];
			req.econNames = [new EconName('production_vs_fit')];
			req.qualifiersService = createQualifierService(testCreateScenario());

			await req.handle(msg);

			expect(msg.response.statusCode).toBe(400);
			expect(msg.response.json).toHaveBeenCalledWith({
				name: 'ActiveQualifierDeletion',
				message: `The qualifier 'production_vs_fit_3' is active qualifier of 'ActualOrForecast' econ model`,
				location: '[0]',
			});
		});

		it('should delete qualifier as expected and call service', async () => {
			const req = new QualifiersDelete();
			const msg = createHttpMessage();

			req.qualifierNames = ['production_vs_fit_2', 'expenses_2'];
			req.econNames = [new EconName('production_vs_fit'), new EconName('expenses')];
			req.qualifiersService = createQualifierService(testCreateScenario());

			const deletedCount = await req.handle(msg);

			expect(req.qualifiersService.deleteScenarioQualifiers).toHaveBeenCalledTimes(1);
			expect(deletedCount).toBe(2);
		});
	});
});
