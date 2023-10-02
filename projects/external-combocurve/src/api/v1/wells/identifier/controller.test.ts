import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { FieldNameError, RecordCountError, RequestStructureError, ValueError } from '@src/helpers/validation';
import { getErrorStatus } from '@src/helpers/test/multi-status';

import { DuplicateIdentifierError, WellNotFoundError } from '../validation';
import { IMultiStatusResponse } from '../../multi-status';

import { patchWellsIdentifier } from './controllers';
import { toUpdatedStatus } from './multi-status';
import { WRITE_RECORD_LIMIT } from './fields';

import { mockExpress } from '@test/express-mocks';

const { MULTI_STATUS } = StatusCodes;

describe('v1/wells/identifier', () => {
	test('patch wells with incorrect payload throws exception', async () => {
		const { req, res } = mockExpress();

		req.body = {};
		res.locals = {
			service: {},
			cachedTenant: {},
		};

		await expect(patchWellsIdentifier(req, res)).rejects.toThrow(RequestStructureError);
	});

	test('patch wells with exceeded payload size  throws exception', async () => {
		const { req, res } = mockExpress();

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()];
		res.locals = {
			service: {},
			cachedTenant: {},
		};

		await expect(patchWellsIdentifier(req, res)).rejects.toThrow(RecordCountError);
	});

	test('patch wells return error when payload is not an object', async () => {
		const expectedMultipleResponse: IMultiStatusResponse = {
			results: [
				getErrorStatus(RequestStructureError.name, 'Invalid data structure', '[0]'),
				getErrorStatus(RequestStructureError.name, 'Invalid data structure', '[1]'),
				getErrorStatus(RequestStructureError.name, 'Invalid data structure', '[2]'),
				getErrorStatus(RequestStructureError.name, 'Invalid data structure', '[3]'),
			],
			successCount: 0,
			failedCount: 4,
		};

		const { req, res } = mockExpress();
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = ['test', 0, null, undefined];
		res.locals = {
			service: { changeWellIdentifiers: () => ({ results: [] }) },
			cachedTenant: { get: jest.fn() },
		};

		await patchWellsIdentifier(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith(expectedMultipleResponse);
	});

	test('patch wells return error when request has invalid properties and values', async () => {
		const expectedMultipleResponse: IMultiStatusResponse = {
			results: [
				getErrorStatus(RequestStructureError.name, 'Invalid data structure', '[0]'),
				getErrorStatus(RequestStructureError.name, 'Invalid data structure', '[1]'),
				getErrorStatus(TypeError.name, '`invalid format` is not a valid ObjectId', '[2]'),
				getErrorStatus(FieldNameError.name, '`invalidProperty` is not a valid field name', '[3]'),
				getErrorStatus(
					ValueError.name,
					'`invalidValue` is not a valid value for this field. Valid choices: `di`, `ihs`, `phdwin`, `aries`, `internal`, `other`.',
					'[4]',
				),
				getErrorStatus(
					ValueError.name,
					'`invalidValue` is not a valid value for this field. Valid choices: `inptID`, `api10`, `api12`, `api14`, `aries_id`, `phdwin_id`.',
					'[5]',
				),
				getErrorStatus(
					ValueError.name,
					'`invalidValue` is not a valid value for this field. Valid choices: ` true `.',
					'[6]',
				),
			],
			successCount: 0,
			failedCount: 7,
		};

		const { req, res } = mockExpress();
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = [
			{ wellId: Types.ObjectId().toString(), newInfo: null },
			{ wellId: null, newInfo: {} },
			{ wellId: 'invalid format', newInfo: {} },
			{ wellId: Types.ObjectId().toString(), newInfo: { invalidProperty: 'test' } },
			{ wellId: Types.ObjectId().toString(), newInfo: { dataSource: 'invalidValue' } },
			{ wellId: Types.ObjectId().toString(), newInfo: { chosenKeyID: 'invalidValue' } },
			{ wellId: Types.ObjectId().toString(), newInfo: { companyScope: 'invalidValue' } },
		];
		res.locals = {
			service: {
				changeWellIdentifiers: () => ({ results: [] }),
			},
			cachedTenant: { get: jest.fn() },
		};
		await patchWellsIdentifier(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith(expectedMultipleResponse);
	});

	test('patch wells return error when request has duplicated wellId', async () => {
		const validObjectId = Types.ObjectId().toString();
		const expectedMultipleResponse: IMultiStatusResponse = {
			results: [
				getErrorStatus(
					DuplicateIdentifierError.name,
					`Duplicate identifier value: \`${validObjectId}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateIdentifierError.name,
					`Duplicate identifier value: \`${validObjectId}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		};

		const { req, res } = mockExpress();
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = [
			{
				wellId: validObjectId,
				newInfo: { companyScope: true, dataSource: 'internal', chosenKeyID: 'aries_id' },
			},
			{
				wellId: validObjectId,
				newInfo: { companyScope: true, dataSource: 'other', chosenKeyID: 'api14' },
			},
		];
		res.locals = {
			service: {
				changeWellIdentifiers: () => ({ results: [] }),
			},
			cachedTenant: { get: jest.fn() },
		};
		await patchWellsIdentifier(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith(expectedMultipleResponse);
	});
	test('patch wells return error when request has nonexistent wells', async () => {
		const validObjectId = Types.ObjectId().toString();
		const validObjectId2 = Types.ObjectId().toString();

		const expectedMultipleResponse: IMultiStatusResponse = {
			results: [
				getErrorStatus(WellNotFoundError.name, `No well was found with id: \`${validObjectId}\``, '[0]'),
				toUpdatedStatus(validObjectId2),
			],
			successCount: 1,
			failedCount: 1,
		};

		const { req, res } = mockExpress();
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = [
			{
				wellId: validObjectId,
				newInfo: { companyScope: true, dataSource: 'internal', chosenKeyID: 'aries_id' },
			},
			{
				wellId: validObjectId2,
				newInfo: { companyScope: true, dataSource: 'other', chosenKeyID: 'api14' },
			},
		];

		res.locals = {
			service: {
				changeWellIdentifiers: () => ({ results: [undefined, toUpdatedStatus(validObjectId2)] }),
				getExistingWellIds: () => [validObjectId2],
			},
			cachedTenant: { get: jest.fn() },
		};
		await patchWellsIdentifier(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith(expectedMultipleResponse);
	});
	test('patch wells remove non exiting wells from service request', async () => {
		const nonExistentWell = Types.ObjectId().toString();
		const validObjectId2 = Types.ObjectId().toString();

		const expectedMultipleResponse: IMultiStatusResponse = {
			results: [
				getErrorStatus(WellNotFoundError.name, `No well was found with id: \`${nonExistentWell}\``, '[0]'),
				toUpdatedStatus(validObjectId2),
			],
			successCount: 1,
			failedCount: 1,
		};

		const { req, res } = mockExpress();
		res.status = jest.fn(() => res);
		res.json = jest.fn();
		const validWellRequest = {
			wellId: validObjectId2.toString(),
			newInfo: { companyScope: true, dataSource: 'other', chosenKeyID: 'api14' },
		};
		req.body = [
			{
				wellId: nonExistentWell,
				newInfo: { companyScope: true, dataSource: 'internal', chosenKeyID: 'aries_id' },
			},
			validWellRequest,
		];

		res.locals = {
			service: {
				changeWellIdentifiers: jest
					.fn()
					.mockReturnValue({ results: [undefined, toUpdatedStatus(validObjectId2)] }),
				getExistingWellIds: () => [validObjectId2],
			},
			cachedTenant: { get: () => 'test-user-id' },
		};
		await patchWellsIdentifier(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.locals.service.changeWellIdentifiers).toHaveBeenCalledWith(
			[undefined, { ...validWellRequest, wellId: validObjectId2 }],
			'test-user-id',
		);
		expect(res.json).toHaveBeenLastCalledWith(expectedMultipleResponse);
	});
});
