import { ApiContextV1 } from '@src/api/v1/context';
import { EconName } from '@src/value-objects/econ-name';
import { HttpMessageContext } from '@src/core/common';
import { IQualifiers } from '@src/models/scenarios';
import { QualifiersService } from '@src/api/v1/projects/scenarios/qualifiers/service';
import { testCreateHttpMessage } from '@src/core/test.exports';
import { testCreateScenario } from '@src/api/v1/projects/scenarios/test.exports';
import { ValidationError } from '@src/helpers/validation';

import { EconModelAssignmentService } from '../../service';

import { EconModelAssignmentDelete } from './delete';

jest.mock('@src/helpers/request');

const createAssignService = () => new EconModelAssignmentService({} as ApiContextV1);
const createQualifierService = () => new QualifiersService({} as ApiContextV1);

describe('EconModelAssignmentDelete', () => {
	describe('validate method', () => {
		it('should add error when service check returns it', async () => {
			const request = new EconModelAssignmentDelete();
			const error = new ValidationError('test', 'test');

			request.allWells = true;
			request.params.econName = new EconName('capex');
			request.services.econModelAssignmentService = createAssignService();
			request.services.econModelAssignmentService.checkEconModel = jest.fn().mockResolvedValue(error);

			await request.validate({} as HttpMessageContext);

			expect(request.errors).toHaveLength(1);
			expect(request.errors[0]).toBe(error);
		});

		it('should add error when wells and allWells are not defined', async () => {
			const request = new EconModelAssignmentDelete();

			request.params.econName = new EconName('production_vs_fit');
			request.services.econModelAssignmentService = createAssignService();
			request.services.econModelAssignmentService.checkEconModel = jest.fn();

			await request.validate({} as HttpMessageContext);

			expect(request.errors).toHaveLength(1);
			expect(request.errors[0].message).toBe('Must provide wells ([ID1, ID2 ...]) or allWells (true)');
		});
	});

	describe('findQualifierKey method', () => {
		it('should return undefined when qualifiers is not defined', () => {
			const request = new EconModelAssignmentDelete();
			const result = request.findQualifierKey('expenses_2', {} as IQualifiers);

			expect(result).toBeUndefined();
		});

		it('should return default when qualifierName Default', () => {
			const request = new EconModelAssignmentDelete();
			const result = request.findQualifierKey('Default', {} as IQualifiers);

			expect(result).toBe('default');
		});

		it('should return the correct qualifierKey', () => {
			const request = new EconModelAssignmentDelete();
			const scenario = testCreateScenario();

			const result = request.findQualifierKey('expenses_2', scenario?.columns?.['expenses']?.qualifiers);

			expect(result).toBe('qualifier2');
		});
	});

	describe('handle method', () => {
		it('should return undefined when qualifiers is not defined', async () => {
			const request = new EconModelAssignmentDelete();

			request.params.econName = new EconName('expenses');
			request.services.qualifiersService = createQualifierService();
			request.services.qualifiersService.getScenarioWithOnlyQualifiers = jest.fn().mockResolvedValue(undefined);

			const httpMessage = testCreateHttpMessage();
			const result = await request.handle(httpMessage);

			expect(result).toBeUndefined();
			expect(httpMessage.response.statusCode).toBe(404);
		});

		it('should call service when everything is fine', async () => {
			const request = new EconModelAssignmentDelete();
			const scenario = testCreateScenario();

			request.params.econName = new EconName('expenses');
			request.scenarioId = scenario._id;
			request.qualifierName = 'expenses_2';

			request.services.econModelAssignmentService = createAssignService();
			request.services.econModelAssignmentService.removeEconFromWells = jest.fn();

			request.services.qualifiersService = createQualifierService();
			request.services.qualifiersService.getScenarioWithOnlyQualifiers = jest.fn().mockResolvedValue(scenario);

			const httpMessage = testCreateHttpMessage();
			await request.handle(httpMessage);

			expect(request.services.econModelAssignmentService.removeEconFromWells).toHaveBeenCalledTimes(1);
			expect(request.services.econModelAssignmentService.removeEconFromWells).toHaveBeenCalledWith(
				scenario._id,
				'qualifier2',
				'expenses',
				undefined,
			);
		});
	});
});
