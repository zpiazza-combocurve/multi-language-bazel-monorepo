import { Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { EconName } from '@src/value-objects/econ-name';
import { HttpMessageContext } from '@src/core/common';
import { testCreateScenario } from '@src/api/v1/projects/scenarios/test.exports';
import { ValidationError } from '@src/helpers/validation';

import { EconModelAssignmentService } from '../../service';

import { EconModelAssignmentUpsert, EconModelAssignmentUpsertPayload } from './upsert';

jest.mock('@src/helpers/request');

const createAssignService = () => new EconModelAssignmentService({} as ApiContextV1);

describe('EconModelsAssignmentsUpsert', () => {
	describe('validate method', () => {
		async function baseTest(error?: ValidationError): Promise<EconModelAssignmentUpsert> {
			const request = new EconModelAssignmentUpsert();

			request.params.econName = new EconName('expenses');
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

	describe('getQualifierKey method', () => {
		it('should return hasQualifier false when scenario not found', async () => {
			const request = new EconModelAssignmentUpsert();
			const scenario = testCreateScenario();

			const result = await request.getQualifierKey(scenario._id.toHexString(), 'test', {});

			expect(result).toStrictEqual({ qualifierKey: '', hasQualifier: false });
		});

		it('should return hasQualifiers false when qualifier not found', async () => {
			const request = new EconModelAssignmentUpsert();
			const scenario = testCreateScenario();

			const result = await request.getQualifierKey(scenario._id.toHexString(), 'test', {
				[scenario._id.toHexString()]: undefined,
			});

			expect(result).toStrictEqual({ qualifierKey: '', hasQualifier: false });
		});

		it('should return return qualifier when present on scenario obj', async () => {
			const request = new EconModelAssignmentUpsert();
			const scenario = testCreateScenario();

			const result = await request.getQualifierKey(scenario._id.toHexString(), 'expenses_2', {
				[scenario._id.toHexString()]: scenario.columns!['expenses'].qualifiers,
			});

			expect(result).toStrictEqual({ qualifierKey: 'qualifier2', hasQualifier: true });
		});
	});

	describe('assign method', () => {
		it('should check allWells before update', async () => {
			const request = new EconModelAssignmentUpsert();
			const scenario = testCreateScenario();

			request.params.econName = new EconName('risking');
			request.params.econModelId = Types.ObjectId();
			request.services.econModelAssignmentService = createAssignService();
			request.services.econModelAssignmentService.assignWellsToEcon = jest.fn();

			const payload: EconModelAssignmentUpsertPayload[] = [
				{
					scenarioID: scenario._id,
					wells: [Types.ObjectId()],
					qualifierName: 'test',
				} as EconModelAssignmentUpsertPayload,
				{
					scenarioID: scenario._id,
					allWells: true,
					qualifierName: 'test',
				} as EconModelAssignmentUpsertPayload,
			];

			await request.assign(scenario._id.toHexString(), 'test', payload);

			expect(request.services.econModelAssignmentService.assignWellsToEcon).toHaveBeenCalledTimes(1);
			expect(request.services.econModelAssignmentService.assignWellsToEcon).toHaveBeenCalledWith(
				scenario._id,
				'test',
				request.params.econName.mongoKey,
				request.params.econModelId,
				undefined,
			);

			payload.forEach((e) =>
				expect(e.processedStatus).toStrictEqual({
					status: 'Created',
					code: 201,
					chosenID: 'test',
				}),
			);
		});
	});
});
