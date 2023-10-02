/* eslint-disable 
	@typescript-eslint/no-explicit-any */

import { ApiContextV1 } from '@src/api/v1/context';
import { EconName } from '@src/value-objects/econ-name';
import { HttpMessageContext } from '@src/core/common';
import { IScenario } from '@src/models/scenarios';
import { ValidationError } from '@src/helpers/validation';

import { QualifiersService } from '../../service';
import { testCreateScenario } from '../../../test.exports';

import { QualifiersUpsert, QualifierUpsertPayload } from './upsert';

import { mockExpress } from '@test/express-mocks';

jest.mock('@src/helpers/request');

const createQualifierService = (scenarioMock?: IScenario): QualifiersService => {
	const output = new QualifiersService({} as ApiContextV1);

	output.updateScenarioQualifiers = jest.fn();
	output.deleteScenarioQualifiers = jest.fn();
	output.getScenarioWithOnlyQualifiers = jest.fn().mockResolvedValue(scenarioMock);

	return output;
};

const createHttpMessage = (): HttpMessageContext => {
	const { req, res } = mockExpress();

	res.status = (status: number) => {
		res.statusCode = status;
		return res;
	};

	return {
		request: req,
		response: res,
	} as HttpMessageContext;
};

describe('qualifiers upsert request', () => {
	describe('addQualifier method', () => {
		const defaultQuafiers = ['Default', 'expenses', 'expenses_2'];

		function baseTest(currentQualifiers = defaultQuafiers, qualifierName = 'expenses_2', econName = 'expenses') {
			const req = new QualifiersUpsert();
			const scenario = testCreateScenario();
			const payload = new QualifierUpsertPayload();

			payload.name = qualifierName;
			payload.econModel = new EconName(econName);
			req.qualifiersService = createQualifierService(scenario);

			req.addQualifier(payload, scenario, currentQualifiers, 1);
			return { req, scenario };
		}

		it('when the qualifier name alredy exists should return an error', () => {
			const { req } = baseTest();

			expect(req.errors).toStrictEqual([new ValidationError(`Qualifier expenses_2 already exists`, `[0]`)]);
		});

		it('when reached the max of qualifiers shoud return an error', () => {
			const qualifiers = Array.from({ length: 20 }, () => 'qualifier');
			const { req } = baseTest(qualifiers, 'expenses_2', 'expenses');

			expect(req.errors).toStrictEqual([new ValidationError(`Maximum number of qualifiers reached`, `[0]`)]);
		});

		it('when it`s all valid should add the qualifier as expected', () => {
			const { req, scenario } = baseTest(defaultQuafiers, 'expenses_3');

			const expenses = (scenario as any).columns.expenses.qualifiers;

			expect(req.errors).toHaveLength(0);
			expect(expenses).toStrictEqual({
				default: { name: 'Default' },
				qualifier1: { name: 'expenses' },
				qualifier2: { name: 'expenses_2' },
				qualifier3: { name: 'expenses_3' },
			});
		});
	});

	describe('updateQualifier method', () => {
		const defaultQuafiers = ['Default', 'expenses', 'expenses_2'];

		function baseTest(
			currentQualifiers = defaultQuafiers,
			qualifierName = 'expenses_2',
			econName = 'expenses',
			newEconName = 'expenses_3',
		) {
			const req = new QualifiersUpsert();
			const scenario = testCreateScenario();
			const payload = new QualifierUpsertPayload();

			payload.name = qualifierName;
			payload.econModel = new EconName(econName);
			payload.newName = newEconName;

			req.qualifiersService = createQualifierService(scenario);

			req.updateQualifier(payload, scenario, currentQualifiers, 0);
			return { req, scenario };
		}

		it('when not found the qualifier should return an error', () => {
			const { req } = baseTest(['Default', 'expenses_x']);

			expect(req.errors).toStrictEqual([
				new ValidationError(`Qualifier expenses_2 not found`, `[0]`, 'QualifierNotFound'),
			]);
		});

		it('when reached the max of qualifiers shoud return an error', () => {
			const { req } = baseTest(defaultQuafiers, 'expenses_2', 'expenses', 'expenses');

			expect(req.errors).toStrictEqual([
				new ValidationError(`Qualifier expenses already exists`, `[0]`, 'DuplicatedQualifier'),
			]);
		});

		it('when it`s all valid should update the qualifier as expected', () => {
			const { req, scenario } = baseTest(defaultQuafiers, 'expenses');

			const expenses = (scenario as any).columns.expenses.qualifiers;

			expect(req.errors).toHaveLength(0);
			expect(expenses).toStrictEqual({
				default: { name: 'Default' },
				qualifier1: { name: 'expenses_3' },
				qualifier2: { name: 'expenses_2' },
			});
		});
	});

	describe('handle method', () => {
		it('should set response as not found when not found scenario', async () => {
			const req = new QualifiersUpsert();
			req.qualifiersService = createQualifierService();

			const msg = createHttpMessage();
			await req.handle(msg);

			expect(msg.response.statusCode).toBe(404);
		});

		it('should add as expected when everything is valid', async () => {
			const req = new QualifiersUpsert();
			const scenario = testCreateScenario();
			const payload = new QualifierUpsertPayload();

			payload.name = 'expenses_3';
			payload.econModel = new EconName('expenses');

			req.qualifiersService = createQualifierService(scenario);
			req.payload = [payload];

			const output = await req.handle(createHttpMessage());

			expect(output).toStrictEqual({
				results: [
					{
						status: 'Created',
						code: 201,
						chosenID: 'expenses_3',
					},
				],
			});
		});

		it('should update as expected when everything is valid', async () => {
			const req = new QualifiersUpsert();
			const scenario = testCreateScenario();
			const payload = new QualifierUpsertPayload();

			payload.name = 'expenses_2';
			payload.econModel = new EconName('expenses');
			payload.newName = 'expenses_x';

			req.qualifiersService = createQualifierService(scenario);
			req.payload = [payload];

			const output = await req.handle(createHttpMessage());

			expect(output).toStrictEqual({
				results: [
					{
						status: 'Updated',
						code: 204,
						chosenID: 'expenses_x',
					},
				],
			});
		});
	});
});
