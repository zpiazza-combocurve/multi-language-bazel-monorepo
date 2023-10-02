import { Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { EconName } from '@src/value-objects/econ-name';
import { HttpMessageContext } from '@src/core/common';
import { QualifiersService } from '@src/api/v1/projects/scenarios/qualifiers/service';
import { testCreateScenario } from '@src/api/v1/projects/scenarios/test.exports';
import { ValidationError } from '@src/helpers/validation';

import { EconModelAssignmentService, IEconModelWellQualifiers } from '../../service';

import { EconModelsAssignmentsRead } from './read';

jest.mock('@src/helpers/request');

const createAssignService = () => new EconModelAssignmentService({} as ApiContextV1);
const createQualifierService = () => new QualifiersService({} as ApiContextV1);

describe('EconModelsAssignmentsRead', () => {
	describe('validate method', () => {
		async function baseTest(error?: ValidationError): Promise<EconModelsAssignmentsRead> {
			const request = new EconModelsAssignmentsRead();

			request.params.econName = new EconName('capex');
			request.services.econModelAssignmentService = createAssignService();
			request.services.econModelAssignmentService.checkEconModel = jest.fn().mockResolvedValue(error);

			await request.validate({} as HttpMessageContext);
			return request;
		}

		it('should add an error when service returns an error', async () => {
			const error = new ValidationError('test');
			const request = await baseTest(error);

			expect(request.errors).toHaveLength(1);
			expect(request.errors[0]).toBe(error);
		});

		it('request errors should be empty when service validation is okay', async () => {
			const request = await baseTest();

			expect(request.errors).toHaveLength(0);
		});
	});

	describe('getQualifierNamesMap method', () => {
		it('should return empty when Default qualifier', async () => {
			const request = new EconModelsAssignmentsRead();
			const input: IEconModelWellQualifiers[] = [
				{
					scenario: Types.ObjectId(),
					well: Types.ObjectId(),
					qualifierKey: 'default',
				},
			];

			request.services.qualifiersService = createQualifierService();
			request.services.qualifiersService.getQualifierNames = jest.fn();

			const result = await request.getQualifierNamesMap(input);

			expect(result).toEqual({});
			expect(request.services.qualifiersService.getQualifierNames).toHaveBeenCalledTimes(0);
		});

		it('should return a map with qualifierKey - qualifierName', async () => {
			const request = new EconModelsAssignmentsRead();
			const testScenario = testCreateScenario();

			const input: IEconModelWellQualifiers[] = [
				{
					scenario: testScenario._id,
					well: Types.ObjectId(),
					qualifierKey: 'qualifier1',
				},
				{
					scenario: testScenario._id,
					well: Types.ObjectId(),
					qualifierKey: 'qualifier2',
				},
			];

			request.params.econName = new EconName('expenses');
			request.services.qualifiersService = createQualifierService();
			request.services.qualifiersService.getQualifierNames = jest.fn().mockResolvedValue([testScenario]);

			const result = await request.getQualifierNamesMap(input);

			expect(result).toStrictEqual({
				[testScenario._id.toHexString()]: {
					default: 'Default',
					qualifier1: 'expenses',
					qualifier2: 'expenses_2',
				},
			});
		});
	});

	it('generateResponse method should return the request response', () => {
		const request = new EconModelsAssignmentsRead();
		const testScenario = testCreateScenario();

		const map = {
			[testScenario._id.toHexString()]: {
				default: 'Default',
				qualifier1: 'expenses',
				qualifier2: 'expenses_2',
			},
		};

		const input: IEconModelWellQualifiers[] = [
			{
				scenario: testScenario._id,
				well: Types.ObjectId(),
				qualifierKey: 'qualifier1',
			},
			{
				scenario: testScenario._id,
				well: Types.ObjectId(),
				qualifierKey: 'qualifier2',
			},
			{
				scenario: testScenario._id,
				well: Types.ObjectId(),
				qualifierKey: 'default',
			},
		];

		const result = request.generateResponse(input, map);

		expect([...result]).toStrictEqual([
			{
				scenario: testScenario._id.toHexString(),
				well: input[0].well.toHexString(),
				qualifier: 'expenses',
			},
			{
				scenario: testScenario._id.toHexString(),
				well: input[1].well.toHexString(),
				qualifier: 'expenses_2',
			},
			{
				scenario: testScenario._id.toHexString(),
				well: input[2].well.toHexString(),
				qualifier: 'Default',
			},
		]);
	});
});
