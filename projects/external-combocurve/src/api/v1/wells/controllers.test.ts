import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { DATA_SOURCES, IWell } from '@src/models/wells';
import {
	DifferentDataSourceError,
	FieldNameFilterError,
	RecordCountError,
	RequestStructureError,
	RequiredFieldError,
	RequiredFilterError,
	TypeError,
	ValidationError,
} from '@src/helpers/validation';
import { generateEnum, generateObjectId, generateString } from '@src/helpers/test/data-generation';
import { getCreatedStatus, getOkStatus } from '@src/helpers/test/multi-status/wells';
import { getErrorStatus, getMultiErrorStatus } from '@src/helpers/test/multi-status';
import { CursorType } from '@src/api/v1/pagination';
import { IUpdate } from '@src/api/v1/fields';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiWell, IReplace, READ_RECORD_LIMIT, WRITE_RECORD_LIMIT } from './fields';
import {
	deleteWellById,
	deleteWells,
	getWellById,
	getWells,
	getWellsHead,
	patchWell,
	patchWells,
	postWells,
	putWell,
	putWells,
} from './controllers';
import {
	DuplicateIdentifierError,
	KeyFieldModificationError,
	NonNullableFieldError,
	ReadOnlyFieldError,
	WellExistsError,
	WellNotFoundError,
} from './validation';

import { mockExpress } from '@test/express-mocks';

const { MULTI_STATUS, NOT_FOUND, OK } = StatusCodes;

const getWellArray = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		id: generateObjectId(i),
		dataSource: generateEnum(i, DATA_SOURCES),
		chosenId: (11111111111111 + i).toString(),
		api10: (11111111111111 + i).toString().slice(0, 10),
		api12: (11111111111111 + i).toString().slice(0, 12),
		api14: (11111111111111 + i).toString(),
		wellName: generateString(i),
	}));

describe('v1/wells/controllers', () => {
	test('getWellsHead', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'wells';

		res.locals = {
			service: {
				getWellsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getWellsHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				'<http://www.localhost.com/wells?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/wells?skip=0&take=25>;rel="last"',
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();
	});

	test('getWells throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'wells';

		res.locals = {
			service: {
				getWells: () => ({ result: [], hasNext: false }),
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getWells, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['api14'] };
		await expect(getWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=api14' };
		await expect(getWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>api14' };
		await expect(getWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+api14' };
		await expect(getWells(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getWells(req, res)).rejects.toThrow(ValidationError);
	});

	test('getWells runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'wells';

		let result: ApiWell[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceWell = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getWells: serviceWell,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getWells(req, res);
		expect(res.set).toHaveBeenCalledWith({ Link: '<http://www.localhost.com/wells?skip=0&take=25>;rel="first"' });
		expect(res.json).toHaveBeenCalledWith([]);

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(
			{
				skip: 0,
				take: 10,
				sort: { id: -1 },
				filters: {},
				cursor: '123456789012345678901234',
			},
			{ company: true },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/wells?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getWellArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(
			{
				skip: 0,
				take: 10,
				sort: { id: -1 },
				filters: {},
				cursor: undefined,
			},
			{ company: true },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/wells?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/wells?take=10>;rel="first"`,
		});

		req.query = { take: '10', wellName: 'default1', sort: '+wellName' };
		result = getWellArray(15);
		hasNext = true;
		cursor = null;
		await getWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(
			{
				skip: 0,
				take: 10,
				sort: { wellName: 1 },
				filters: { wellName: ['default1'] },
				cursor: undefined,
			},
			{ company: true },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/wells?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/wells?skip=0&take=10>;rel="first"`,
		});
	});

	test('getWellById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
		};

		res.sendStatus = jest.fn();

		await expect(getWellById(req, res)).rejects.toThrow(WellNotFoundError);
	});

	test('postWells', async () => {
		const { req, res } = mockExpress();
		let existingIds: string[] = [];
		res.locals = {
			service: {
				toDbWell: ({ chosenID, api14, dataSource }: ApiWell) => ({
					chosenID: dataSource === 'di' ? chosenID ?? api14 : chosenID,
					api14,
					dataSource,
				}),
				getExistingChosenIds: () => existingIds,
				create: (wells: Array<IWell | undefined>) => ({
					results: wells.map((w) => w && getCreatedStatus(w.chosenID)),
				}),
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postWells(req, res)).rejects.toThrow(RecordCountError);

		req.body = [
			{ api14: '11111111111111', dataSource: 'di' },
			{ api14: '11111111111111', dataSource: 'di' },
		];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: `11111111111111`',
					'[0], [1]',
					'11111111111111',
				),
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: `11111111111111`',
					'[0], [1]',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = [
			{ chosenID: '11111111111111', dataSource: 'di' },
			{ chosenID: '11111111111111', dataSource: 'di' },
		];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: `11111111111111`',
					'[0], [1]',
					'11111111111111',
				),
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: `11111111111111`',
					'[0], [1]',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = [
			{ chosenID: '11111111111111', dataSource: 'di' },
			{ api14: '11111111111111', dataSource: 'di' },
		];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: `11111111111111`',
					'[0], [1]',
					'11111111111111',
				),
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: `11111111111111`',
					'[0], [1]',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		existingIds = ['11111111111111'];
		req.body = [
			{ api14: '11111111111111', dataSource: 'di' },
			{ api14: '22222222222222', dataSource: 'di' },
		];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellExistsError.name,
					'Well with identifier `11111111111111` already exists',
					'[0]',
					'11111111111111',
				),
				getCreatedStatus('22222222222222'),
			],
			successCount: 1,
			failedCount: 1,
		});

		existingIds = ['11111111111111', '22222222222222'];
		req.body = [
			{ api14: '11111111111111', dataSource: 'di' },
			{ chosenID: '22222222222222', dataSource: 'di' },
		];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellExistsError.name,
					'Well with identifier `11111111111111` already exists',
					'[0]',
					'11111111111111',
				),
				getErrorStatus(
					WellExistsError.name,
					'Well with identifier `22222222222222` already exists',
					'[1]',
					'22222222222222',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		existingIds = [];
		req.body = [
			{ chosenID: '11111111111111', dataSource: 'di' },
			{ api14: '22222222222222', dataSource: 'di' },
		];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus('11111111111111'), getCreatedStatus('22222222222222')],
			successCount: 2,
			failedCount: 0,
		});

		existingIds = [];
		req.body = [
			{ chosenID: '11111111111111', dataSource: 'other' },
			{ api14: '22222222222222', dataSource: 'other' },
			{ dataSource: 'di' },
		];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getCreatedStatus('11111111111111'),
				getErrorStatus(RequiredFieldError.name, 'Missing required field: `chosenID`', '[1]'),
				getErrorStatus(RequiredFieldError.name, 'Missing required field: `chosenID`', '[2]'),
			],
			successCount: 1,
			failedCount: 2,
		});

		existingIds = [];
		req.body = [{ chosenID: '22222222222222', dataSource: 'other', inptID: 'Inpt84321' }];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					ReadOnlyFieldError.name,
					'Cannot write to read-only field `inptID`. Please remove it from the input data',
					'[0]',
					'22222222222222',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		existingIds = [];
		req.body = [
			{ api14: '11111111111111', dataSource: 'di' },
			{ chosenID: '22222222222222', dataSource: 'other' },
		];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getCreatedStatus('11111111111111'),
				getErrorStatus(
					DifferentDataSourceError.name,
					'Different data source found: `other`. All wells in a request must be from the same data source.',
					'[1]',
					'22222222222222',
				),
			],
			successCount: 1,
			failedCount: 1,
		});

		existingIds = [];
		req.body = [{ api14: '11111111111111', dataSource: 'di' }];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus('11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		existingIds = [];
		req.body = [{ chosenID: '11111111111111', api14: '22222222222222', dataSource: 'di' }];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus('11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		existingIds = [];
		req.body = [{ api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null }];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus('11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		existingIds = [];
		req.body = [
			{
				api14: '37005239860000',
				chosenID: '37005239860000',
				dataSource: 'internal',
			},
			{
				api14: '37005239860000',
				chosenID: '37005239860000',
				dataSource: 'internal',
			},
			{
				api14: '37005239860001',
				chosenID: '37005239860001',
				dataSource: 'internal',
			},
		];
		await postWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: `37005239860000`',
					'[0], [1]',
					'37005239860000',
				),
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: `37005239860000`',
					'[0], [1]',
					'37005239860000',
				),
				getCreatedStatus('37005239860001'),
			],
			successCount: 1,
			failedCount: 2,
		});
	});

	test('putWell', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		let matchingWells: Partial<IWell>[] = [];
		res.locals = {
			service: {
				getMatchingWellsById: () => matchingWells,
				replaceWell: (r: IReplace) => r && getOkStatus(r.id, r.update.chosenID ?? ''),
			},
		};
		res.sendStatus = jest.fn();
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await expect(putWell(req, res)).rejects.toThrow(RequestStructureError);

		req.body = [];
		await expect(putWell(req, res)).rejects.toThrow(RequestStructureError);

		req.body = { api14: '11111111111111', dataSource: 'di' };
		await putWell(req, res);
		expect(res.sendStatus).toHaveBeenCalledWith(NOT_FOUND);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '22222222222222', dataSource: 'di' }];
		req.body = { api14: '11111111111111', dataSource: 'di' };
		await expect(putWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '22222222222222', dataSource: 'di' }];
		req.body = { chosenID: '11111111111111', dataSource: 'di' };
		await expect(putWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'other' }];
		req.body = { api14: '11111111111111', dataSource: 'di' };
		await expect(putWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'di' }];
		req.body = { chosenID: '11111111111111', dataSource: 'other' };
		await expect(putWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'other' }];
		req.body = { chosenID: '11111111111111', dataSource: 'di' };
		await expect(putWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [
			{ _id: Types.ObjectId('123456789012345678901234'), chosenID: '11111111111111', dataSource: 'di' },
		];
		req.params = { id: Types.ObjectId('123456789012345678901234').toString() };
		req.body = { api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null };
		await putWell(req, res);
		expect(res.status).toHaveBeenLastCalledWith(OK);
		expect(res.json).toHaveBeenLastCalledWith(
			getOkStatus(Types.ObjectId('123456789012345678901234'), '11111111111111'),
		);

		matchingWells = [
			{ _id: Types.ObjectId('123456789012345678901234'), chosenID: '11111111111111', dataSource: 'di' },
		];
		req.params = { id: Types.ObjectId('123456789012345678901234').toString() };
		req.body = {
			chosenID: '11111111111111',
			api14: '22222222222222',
			dataSource: 'di',
			abstract: null,
			perfLateralLength: null,
		};
		await putWell(req, res);
		expect(res.status).toHaveBeenLastCalledWith(OK);
		expect(res.json).toHaveBeenLastCalledWith(
			getOkStatus(Types.ObjectId('123456789012345678901234'), '11111111111111'),
		);
	});

	test('putWells', async () => {
		const { req, res } = mockExpress();

		let matchingWells: Partial<IWell>[] = [];
		res.locals = {
			service: {
				getMatchingWellsMixed: () => matchingWells,
				toDbWell: ({ chosenID, api14, dataSource }: ApiWell) => ({
					chosenID: dataSource === 'di' ? chosenID ?? api14 : chosenID,
					api14,
					dataSource,
				}),
				replaceWells: (replace: Array<IReplace | undefined>) => ({
					results: replace.map((r) => r && getOkStatus(r.id, r.update.chosenID ?? '')),
				}),
				create: (wells: Array<IWell | undefined>) => ({
					results: wells.map((w) => w && getCreatedStatus(w.chosenID)),
				}),
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putWells(req, res)).rejects.toThrow(RecordCountError);

		req.body = [{}];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `dataSource`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const id1 = Types.ObjectId();
		req.body = [{ id: id1.toString(), api14: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id1, chosenID: '22222222222222', dataSource: 'di' }];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					KeyFieldModificationError.name,
					'Invalid identifier value: `11111111111111`. Cannot change the identifier of an existing well',
					'[0]',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		const id12 = Types.ObjectId();
		req.body = [{ id: id12.toString(), chosenID: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id12, chosenID: '22222222222222', dataSource: 'di' }];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					KeyFieldModificationError.name,
					'Invalid identifier value: `11111111111111`. Cannot change the identifier of an existing well',
					'[0]',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		const id21 = Types.ObjectId();
		const id22 = Types.ObjectId();
		req.body = [
			{ id: id21.toString(), api14: '11111111111111', dataSource: 'di' },
			{ id: id22.toString(), chosenID: '22222222222222', dataSource: 'other' },
		];
		matchingWells = [
			{ _id: id21, chosenID: '11111111111111', dataSource: 'di' },
			{ _id: id22, chosenID: '22222222222222', dataSource: 'di' },
		];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getOkStatus(id21, '11111111111111'),
				getErrorStatus(
					DifferentDataSourceError.name,
					'Different data source found: `other`. All wells in a request must be from the same data source.',
					'[1]',
					'22222222222222',
				),
			],
			successCount: 1,
			failedCount: 1,
		});

		const id3 = Types.ObjectId();
		req.body = [{ id: id3.toString(), api14: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id3, chosenID: '11111111111111', dataSource: 'other' }];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					KeyFieldModificationError.name,
					'Invalid dataSource value: `di`. Cannot change the dataSource value of an existing well',
					'[0].dataSource',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		const id4 = Types.ObjectId();
		req.body = [{ id: id4.toString(), api14: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id4, chosenID: '11111111111111', dataSource: 'di' }];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id4, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id42 = Types.ObjectId();
		req.body = [{ id: id42.toString(), chosenID: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id42, chosenID: '11111111111111', dataSource: 'di' }];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id42, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id5 = Types.ObjectId();
		req.body = [
			{ id: id5.toString(), api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null },
		];
		matchingWells = [{ _id: id5, chosenID: '11111111111111', dataSource: 'di' }];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id5, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id6 = Types.ObjectId();
		req.body = [{ api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null }];
		matchingWells = [{ _id: id6, chosenID: '11111111111111', dataSource: 'di' }];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id6, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id62 = Types.ObjectId();
		req.body = [
			{
				chosenID: '11111111111111',
				api14: '22222222222222',
				dataSource: 'di',
				abstract: null,
				perfLateralLength: null,
			},
		];
		matchingWells = [{ _id: id62, chosenID: '11111111111111', dataSource: 'di' }];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id62, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id7 = Types.ObjectId();
		req.body = [{ chosenID: '11111111111111', dataSource: 'internal', abstract: null, perfLateralLength: null }];
		matchingWells = [{ _id: id7, chosenID: '11111111111111', dataSource: 'internal' }];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id7, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id81 = Types.ObjectId();
		const id82 = Types.ObjectId();
		req.body = [
			{
				id: id81.toString(),
				chosenID: '11111111111111',
				wellName: 'updated well name 1',
				dataSource: 'internal',
			},
			{ chosenID: '22222222222222', wellName: 'new well name 1', dataSource: 'internal' },
			{ chosenID: '33333333333333', wellName: 'updated well name 2', dataSource: 'internal' },
			{ wellName: 'error well name', dataSource: 'internal' },
		];
		matchingWells = [
			{ _id: id81, chosenID: '11111111111111', dataSource: 'internal' },
			{ _id: id82, chosenID: '33333333333333', dataSource: 'internal' },
		];
		await putWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getOkStatus(id81, '11111111111111'),
				getCreatedStatus('22222222222222'),
				getOkStatus(id82, '33333333333333'),
				getErrorStatus(RequiredFieldError.name, 'Missing required field: `chosenID`', '[3]'),
			],
			successCount: 3,
			failedCount: 1,
		});
	});

	test('patchWell', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		let matchingWells: Partial<IWell>[] = [];
		res.locals = {
			service: {
				getMatchingWellsById: () => matchingWells,
				updateWell: (u: IUpdate<IWell>) => u && getOkStatus(u.id, u.update.chosenID ?? ''),
			},
		};
		res.sendStatus = jest.fn();
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await expect(patchWell(req, res)).rejects.toThrow(RequestStructureError);

		req.body = [];
		await expect(patchWell(req, res)).rejects.toThrow(RequestStructureError);

		req.body = { api14: '11111111111111', dataSource: 'di' };
		await patchWell(req, res);
		expect(res.sendStatus).toHaveBeenCalledWith(NOT_FOUND);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '22222222222222', dataSource: 'di' }];
		req.body = { api14: '11111111111111', dataSource: 'di' };
		await expect(patchWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '22222222222222', dataSource: 'di' }];
		req.body = { chosenID: '11111111111111', dataSource: 'di' };
		await expect(patchWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'other' }];
		req.body = { api14: '11111111111111', dataSource: 'di' };
		await expect(patchWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'di' }];
		req.body = { chosenID: '11111111111111', dataSource: 'other' };
		await expect(patchWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [
			{ _id: Types.ObjectId('123456789012345678901234'), chosenID: '11111111111111', dataSource: 'di' },
		];
		req.params = { id: Types.ObjectId('123456789012345678901234').toString() };
		req.body = { api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null };
		await patchWell(req, res);
		expect(res.status).toHaveBeenLastCalledWith(OK);
		expect(res.json).toHaveBeenLastCalledWith(
			getOkStatus(Types.ObjectId('123456789012345678901234'), '11111111111111'),
		);

		matchingWells = [
			{ _id: Types.ObjectId('123456789012345678901234'), chosenID: '11111111111111', dataSource: 'di' },
		];
		req.params = { id: Types.ObjectId('123456789012345678901234').toString() };
		req.body = { chosenID: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null };
		await patchWell(req, res);
		expect(res.status).toHaveBeenLastCalledWith(OK);
		expect(res.json).toHaveBeenLastCalledWith(
			getOkStatus(Types.ObjectId('123456789012345678901234'), '11111111111111'),
		);
	});

	test('patchWells', async () => {
		const { req, res } = mockExpress();

		let matchingWells: Partial<IWell>[] = [];
		res.locals = {
			service: {
				getMatchingWellsMixed: () => matchingWells,
				toPartialWell: ({ chosenID, api14, dataSource }: ApiWell) => ({
					update: { chosenID: dataSource === 'di' ? chosenID ?? api14 : chosenID, api14, dataSource },
				}),
				updateWells: (updates: Array<IUpdate<IWell> | undefined>) => ({
					results: updates.map((u) => u && getOkStatus(u.id, u.update.chosenID ?? '')),
				}),
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(patchWells(req, res)).rejects.toThrow(RecordCountError);

		req.body = [{}];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `dataSource`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const id1 = Types.ObjectId();
		req.body = [{ id: id1.toString(), api14: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id1, chosenID: '22222222222222', dataSource: 'di' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					KeyFieldModificationError.name,
					'Invalid identifier value: `11111111111111`. Cannot change the identifier of an existing well',
					'[0]',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		const id12 = Types.ObjectId();
		req.body = [{ id: id12.toString(), chosenID: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id12, chosenID: '22222222222222', dataSource: 'di' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					KeyFieldModificationError.name,
					'Invalid identifier value: `11111111111111`. Cannot change the identifier of an existing well',
					'[0]',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [{ id: id1.toString(), chosenID: null, dataSource: 'di' }];
		matchingWells = [{ _id: id1, chosenID: '22222222222222', dataSource: 'di' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(NonNullableFieldError.name, 'Required field `chosenID` is not nullable', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		const id21 = Types.ObjectId();
		const id22 = Types.ObjectId();
		req.body = [
			{ id: id21.toString(), api14: '11111111111111', dataSource: 'di' },
			{ id: id22.toString(), chosenID: '22222222222222', dataSource: 'other' },
		];
		matchingWells = [
			{ _id: id21, chosenID: '11111111111111', dataSource: 'di' },
			{ _id: id22, chosenID: '22222222222222', dataSource: 'di' },
		];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getOkStatus(id21, '11111111111111'),
				getErrorStatus(
					DifferentDataSourceError.name,
					'Different data source found: `other`. All wells in a request must be from the same data source.',
					'[1]',
					'22222222222222',
				),
			],
			successCount: 1,
			failedCount: 1,
		});

		const id3 = Types.ObjectId();
		req.body = [{ id: id3.toString(), api14: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id3, chosenID: '11111111111111', dataSource: 'other' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					KeyFieldModificationError.name,
					'Invalid dataSource value: `di`. Cannot change the dataSource value of an existing well',
					'[0].dataSource',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		const id4 = Types.ObjectId();
		req.body = [{ id: id4.toString(), api14: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id4, chosenID: '11111111111111', dataSource: 'di' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id4, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id42 = Types.ObjectId();
		req.body = [{ id: id42.toString(), chosenID: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id42, chosenID: '11111111111111', dataSource: 'di' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id42, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id5 = Types.ObjectId();
		req.body = [
			{ id: id5.toString(), api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null },
		];
		matchingWells = [{ _id: id5, chosenID: '11111111111111', dataSource: 'di' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id5, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id6 = Types.ObjectId();
		req.body = [{ api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null }];
		matchingWells = [{ _id: id6, chosenID: '11111111111111', dataSource: 'di' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id6, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id62 = Types.ObjectId();
		req.body = [
			{
				chosenID: '11111111111111',
				api14: '22222222222222',
				dataSource: 'di',
				abstract: null,
				perfLateralLength: null,
			},
		];
		matchingWells = [{ _id: id62, chosenID: '11111111111111', dataSource: 'di' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id62, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id7 = Types.ObjectId();
		req.body = [{ chosenID: '11111111111111', dataSource: 'internal', abstract: null, perfLateralLength: null }];
		matchingWells = [{ _id: id7, chosenID: '11111111111111', dataSource: 'internal' }];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id7, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id81 = Types.ObjectId();
		const id82 = Types.ObjectId();
		req.body = [
			{
				id: id81.toString(),
				chosenID: '11111111111111',
				wellName: 'updated well name 1',
				dataSource: 'internal',
			},
			{ chosenID: '22222222222222', wellName: 'new well name 1', dataSource: 'internal' },
			{ chosenID: '33333333333333', wellName: 'updated well name 2', dataSource: 'internal' },
			{ wellName: 'error well name', dataSource: 'internal' },
		];
		matchingWells = [
			{ _id: id81, chosenID: '11111111111111', dataSource: 'internal' },
			{ _id: id82, chosenID: '33333333333333', dataSource: 'internal' },
		];
		await patchWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getOkStatus(id81, '11111111111111'),
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with data source `internal` and chosen id `22222222222222` in company scope',
					'[1]',
					'22222222222222',
				),
				getOkStatus(id82, '33333333333333'),
				getErrorStatus(RequiredFieldError.name, 'Missing required field: `chosenID`', '[3]'),
			],
			successCount: 2,
			failedCount: 2,
		});
	});

	test('deleteWells runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'wells';

		let result = 0;
		const serviceWell = jest.fn(() => result);

		res.locals = {
			service: {
				deleteWells: serviceWell,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		let serviceCallTimes = serviceWell.mock.calls.length;
		await expect(deleteWells(req, res)).rejects.toThrow(RequiredFilterError);
		// Service must not be called
		expect(serviceWell.mock.calls.length).toBe(serviceCallTimes);

		serviceCallTimes = serviceWell.mock.calls.length;
		req.query = { dataSource: 'internal' };
		await expect(deleteWells(req, res)).rejects.toThrow(RequiredFilterError);
		// Service must not be called
		expect(serviceWell.mock.calls.length).toBe(serviceCallTimes);

		serviceCallTimes = serviceWell.mock.calls.length;
		req.query = { wellName: 'delete well' };
		result = 5;
		await expect(deleteWells(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceWell.mock.calls.length).toBe(serviceCallTimes);

		req.query = { dataSource: 'internal', chosenID: '22222222222222' };
		result = 6;
		await deleteWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith({ dataSource: ['internal'], chosenID: ['22222222222222'] });
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});

		req.query = { dataSource: 'internal', chosenID: ['22222222222222', '33333333333333'] };
		result = 6;
		await deleteWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith({
			dataSource: ['internal'],
			chosenID: ['22222222222222', '33333333333333'],
		});
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});

		// Remove duplicates
		req.query = { id: ['123456789012345678901234', '123456789012345678901234'] };
		result = 6;
		await deleteWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith({
			id: ['123456789012345678901234'],
		});
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});

		// Remove duplicates
		req.query = { id: ['123456789012345678901234', '123456789012345678901235'] };
		result = 6;
		await deleteWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith({
			id: ['123456789012345678901234', '123456789012345678901235'],
		});
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});
	});

	test('deleteWellById', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'wells';

		const result = 1;
		const serviceWell = jest.fn(() => result);

		res.locals = {
			service: {
				deleteWellById: serviceWell,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		req.params = { id: '5e272d38b78910dd2a1bd691' };

		await deleteWellById(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(Types.ObjectId('5e272d38b78910dd2a1bd691'));
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '1',
		});
		expect(res.json).not.toHaveBeenCalled();

		req.params = { id: 'not-object-id' };
		await expect(deleteWellById(req, res)).rejects.toThrow(TypeError);
	});
});
