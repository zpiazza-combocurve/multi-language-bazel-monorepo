import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { ApiWell, IReplace, READ_RECORD_LIMIT } from '@src/api/v1/wells/fields';
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
import {
	DuplicateIdentifierError,
	KeyFieldModificationError,
	ReadOnlyFieldError,
	WellExistsError,
	WellNotFoundError,
} from '@src/api/v1/wells/validation';
import {
	generateEnum,
	generateObjectId,
	generateObjectIdArray,
	generateString,
} from '@src/helpers/test/data-generation';
import { getCreatedStatus, getOkStatus } from '@src/helpers/test/multi-status/wells';
import { getErrorStatus, getMultiErrorStatus } from '@src/helpers/test/multi-status';
import { CursorType } from '@src/api/v1/pagination';
import { IUpdate } from '@src/api/v1/fields';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { PROJECT_WELLS_LIMIT, ProjectWellLimitError } from '../validation';

import {
	deleteProjectWellById,
	deleteProjectWells,
	getProjectWellById,
	getProjectWells,
	getProjectWellsHead,
	patchProjectWell,
	patchProjectWells,
	postProjectWells,
	putProjectWell,
	putProjectWells,
} from './controllers';
import { ProjectResolved, WRITE_RECORD_LIMIT } from './fields';

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

describe('v1/projects/:projectId/wells/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getProjectWellsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/wells';

		res.locals = {
			service: {
				getWellsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProjectWellsHead, READ_RECORD_LIMIT);
	});

	test('getProjectWellsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/wells`;

		req.originalUrl = originalUrl;

		let count = 0;

		const getWellsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getWellsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getProjectWellsHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getProjectWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith({}, { project, company: false });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getProjectWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith({}, { project, company: false });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '30', take: '10' };
		count = 35;
		await getProjectWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith({}, { project, company: false });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', wellName: 'BRISCOE' };
		count = 35;
		await getProjectWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith({ wellName: ['BRISCOE'] }, { project, company: false });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getWellsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', wellName: 'BRISCOE', a: 'b' };
		count = 35;
		await expect(getProjectWellsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getWellsCount.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', wellName: 'BRISCOE', api14: '42479392700000' };
		count = 35;
		await getProjectWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith(
			{ wellName: ['BRISCOE'], api14: ['42479392700000'] },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});
	});

	test('getProjectWells throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/wells`;

		res.locals = {
			service: {
				getProjectWells: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProjectWells, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getProjectWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['api14'] };
		await expect(getProjectWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getProjectWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getProjectWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=api14' };
		await expect(getProjectWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>api14' };
		await expect(getProjectWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+api14' };
		await expect(getProjectWells(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getProjectWells(req, res)).rejects.toThrow(ValidationError);
	});

	test('getProjectWells runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/wells`;

		req.originalUrl = originalUrl;

		let result: ApiWell[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceProjectWell = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getWells: serviceProjectWell,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 25, sort: { id: -1 }, filters: {} },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getWellArray(3);
		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 25, sort: { id: -1 }, filters: {} },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getWellArray(3));

		result = getWellArray(25);
		hasNext = true;
		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 25, sort: { id: -1 }, filters: {} },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getWellArray(25));

		req.query = { skip: '25' };
		result = getWellArray(25);
		hasNext = true;
		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 25, take: 25, sort: { id: -1 }, filters: {} },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getWellArray(25));

		req.query = { skip: '30', take: '10' };
		result = getWellArray(5);
		hasNext = false;
		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 30, take: 10, sort: { id: -1 }, filters: {} },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', wellName: 'BRISCOE' };
		result = getWellArray(5);
		hasNext = false;
		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 30, take: 10, sort: { id: -1 }, filters: { wellName: ['BRISCOE'] } },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		let serviceCallTimes = serviceProjectWell.mock.calls.length;
		req.query = { skip: '30', take: '10', wellName: 'BRISCOE', a: 'b' };
		result = getWellArray(5);
		hasNext = false;
		await expect(getProjectWells(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceProjectWell.mock.calls.length).toBe(serviceCallTimes);

		serviceCallTimes = serviceProjectWell.mock.calls.length;
		req.query = { skip: '30', take: '10', wellName: 'BRISCOE', a: 'b', sort: '-api14' };
		result = getWellArray(5);
		hasNext = false;
		await expect(getProjectWells(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceProjectWell.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', wellName: 'BRISCOE', api14: '42479392700000', sort: '-api14' };
		result = getWellArray(5);
		hasNext = false;
		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 30, take: 10, sort: { api14: -1 }, filters: { wellName: ['BRISCOE'], api14: ['42479392700000'] } },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 10, sort: { id: -1 }, filters: {}, cursor: '123456789012345678901234' },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getWellArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 10, sort: { id: -1 }, filters: {}, cursor: undefined },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', wellName: 'default1', sort: '+wellName' };
		result = getWellArray(15);
		hasNext = true;
		cursor = null;
		await getProjectWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 10, sort: { wellName: 1 }, filters: { wellName: ['default1'] }, cursor: undefined },
			{ project, company: false },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});

	test('getProjectWellById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getProjectWellById(req, res)).rejects.toThrow(WellNotFoundError);
	});

	test('postProjectWells', async () => {
		const { req, res } = mockExpress();
		const project: ProjectResolved = {
			name: 'Test Project',
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			wells: [],
		};
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
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postProjectWells(req, res)).rejects.toThrow(RecordCountError);

		req.body = [
			{ api14: '11111111111111', dataSource: 'di' },
			{ api14: '11111111111111', dataSource: 'di' },
		];
		await postProjectWells(req, res);
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
		await postProjectWells(req, res);
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
		await postProjectWells(req, res);
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
		await postProjectWells(req, res);
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
		await postProjectWells(req, res);
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
		await postProjectWells(req, res);
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
		];
		await postProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getCreatedStatus('11111111111111'),
				getErrorStatus(RequiredFieldError.name, 'Missing required field: `chosenID`', '[1]'),
			],
			successCount: 1,
			failedCount: 1,
		});

		existingIds = [];
		req.body = [{ chosenID: '22222222222222', dataSource: 'other', inptID: 'Inpt84321' }];
		await postProjectWells(req, res);
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
		await postProjectWells(req, res);
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
		await postProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus('11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		existingIds = [];
		req.body = [{ chosenID: '11111111111111', api14: '22222222222222', dataSource: 'di' }];
		await postProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus('11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		existingIds = [];
		req.body = [{ api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null }];
		await postProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus('11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		existingIds = [];
		req.body = [{ api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null }];
		project.wells = generateObjectIdArray(PROJECT_WELLS_LIMIT);
		await expect(postProjectWells(req, res)).rejects.toThrow(ProjectWellLimitError);
	});

	test('patchProjectWell', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };
		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		let matchingWells: Partial<IWell>[] = [];
		res.locals = {
			service: {
				getMatchingWellsById: () => matchingWells,
				updateWell: (u: IUpdate<IWell>) => u && getOkStatus(u.id, u.update.chosenID ?? ''),
			},
			project,
		};
		res.sendStatus = jest.fn();
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await expect(patchProjectWell(req, res)).rejects.toThrow(RequestStructureError);

		req.body = [];
		await expect(patchProjectWell(req, res)).rejects.toThrow(RequestStructureError);

		req.body = { api14: '11111111111111', dataSource: 'di' };
		await patchProjectWell(req, res);
		expect(res.sendStatus).toHaveBeenCalledWith(NOT_FOUND);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '22222222222222', dataSource: 'di' }];
		req.body = { api14: '11111111111111', dataSource: 'di' };
		await expect(patchProjectWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '22222222222222', dataSource: 'di' }];
		req.body = { chosenID: '11111111111111', dataSource: 'di' };
		await expect(patchProjectWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'other' }];
		req.body = { api14: '11111111111111', dataSource: 'di' };
		await expect(patchProjectWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'di' }];
		req.body = { chosenID: '11111111111111', dataSource: 'other' };
		await expect(patchProjectWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [
			{ _id: Types.ObjectId('123456789012345678901234'), chosenID: '11111111111111', dataSource: 'di' },
		];
		req.params = { id: Types.ObjectId('123456789012345678901234').toString() };
		req.body = { api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null };
		await patchProjectWell(req, res);
		expect(res.status).toHaveBeenLastCalledWith(OK);
		expect(res.json).toHaveBeenLastCalledWith(
			getOkStatus(Types.ObjectId('123456789012345678901234'), '11111111111111'),
		);

		matchingWells = [
			{ _id: Types.ObjectId('123456789012345678901234'), chosenID: '11111111111111', dataSource: 'di' },
		];
		req.params = { id: Types.ObjectId('123456789012345678901234').toString() };
		req.body = { chosenID: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null };
		await patchProjectWell(req, res);
		expect(res.status).toHaveBeenLastCalledWith(OK);
		expect(res.json).toHaveBeenLastCalledWith(
			getOkStatus(Types.ObjectId('123456789012345678901234'), '11111111111111'),
		);
	});

	test('patchProjectWells', async () => {
		const { req, res } = mockExpress();

		let matchingWells: Partial<IWell>[] = [];
		const project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				getMatchingWellsMixed: () => matchingWells,
				toPartialWell: ({ chosenID, api14, dataSource }: ApiWell) => ({
					chosenID: dataSource === 'di' ? chosenID ?? api14 : chosenID,
					api14,
					dataSource,
				}),
				updateWells: (updates: Array<IUpdate<IWell> | undefined>) => ({
					results: updates.map((u) => u && getOkStatus(u.id, u.update.chosenID ?? '')),
				}),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await patchProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await patchProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await patchProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(patchProjectWells(req, res)).rejects.toThrow(RecordCountError);

		req.body = [{}];
		await patchProjectWells(req, res);
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
		await patchProjectWells(req, res);
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
		await patchProjectWells(req, res);
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
		await patchProjectWells(req, res);
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
		await patchProjectWells(req, res);
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
		await patchProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id4, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id42 = Types.ObjectId();
		req.body = [{ id: id42.toString(), chosenID: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id42, chosenID: '11111111111111', dataSource: 'di' }];
		await patchProjectWells(req, res);
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
		await patchProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id5, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id6 = Types.ObjectId();
		req.body = [{ api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null }];
		matchingWells = [{ _id: id6, chosenID: '11111111111111', dataSource: 'di' }];
		await patchProjectWells(req, res);
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
		await patchProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id62, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id7 = Types.ObjectId();
		req.body = [{ chosenID: '11111111111111', dataSource: 'internal', abstract: null, perfLateralLength: null }];
		matchingWells = [{ _id: id7, chosenID: '11111111111111', dataSource: 'internal' }];
		await patchProjectWells(req, res);
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
		await patchProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getOkStatus(id81, '11111111111111'),
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with data source `internal` and chosen id `22222222222222` in project `5e272bed4b97ed00132f2271:' +
						project.name +
						'`',
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

	test('putProjectWell', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };
		const project: ProjectResolved = {
			name: 'Test Project',
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			wells: [],
		};

		let matchingWells: Partial<IWell>[] = [];
		res.locals = {
			service: {
				getMatchingWellsById: () => matchingWells,
				replaceWell: (r: IReplace) => r && getOkStatus(r.id, r.update.chosenID ?? ''),
			},
			project,
		};
		res.sendStatus = jest.fn();
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await expect(putProjectWell(req, res)).rejects.toThrow(RequestStructureError);

		req.body = [];
		await expect(putProjectWell(req, res)).rejects.toThrow(RequestStructureError);

		req.body = { api14: '11111111111111', dataSource: 'di' };
		await putProjectWell(req, res);
		expect(res.sendStatus).toHaveBeenCalledWith(NOT_FOUND);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '22222222222222', dataSource: 'di' }];
		req.body = { api14: '11111111111111', dataSource: 'di' };
		await expect(putProjectWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '22222222222222', dataSource: 'di' }];
		req.body = { chosenID: '11111111111111', dataSource: 'di' };
		await expect(putProjectWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'other' }];
		req.body = { api14: '11111111111111', dataSource: 'di' };
		await expect(putProjectWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'di' }];
		req.body = { chosenID: '11111111111111', dataSource: 'other' };
		await expect(putProjectWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [{ _id: Types.ObjectId(), chosenID: '11111111111111', dataSource: 'other' }];
		req.body = { chosenID: '11111111111111', dataSource: 'di' };
		await expect(putProjectWell(req, res)).rejects.toThrow(KeyFieldModificationError);

		matchingWells = [
			{ _id: Types.ObjectId('123456789012345678901234'), chosenID: '11111111111111', dataSource: 'di' },
		];
		req.params = { id: Types.ObjectId('123456789012345678901234').toString() };
		req.body = { api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null };
		await putProjectWell(req, res);
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
		await putProjectWell(req, res);
		expect(res.status).toHaveBeenLastCalledWith(OK);
		expect(res.json).toHaveBeenLastCalledWith(
			getOkStatus(Types.ObjectId('123456789012345678901234'), '11111111111111'),
		);

		// Limit but it is an update should pass
		matchingWells = [
			{ _id: Types.ObjectId('123456789012345678901234'), chosenID: '11111111111111', dataSource: 'di' },
		];
		req.params = { id: Types.ObjectId('123456789012345678901234').toString() };
		req.body = { api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null };
		project.wells = generateObjectIdArray(PROJECT_WELLS_LIMIT);
		await putProjectWell(req, res);
		expect(res.status).toHaveBeenLastCalledWith(OK);
		expect(res.json).toHaveBeenLastCalledWith(
			getOkStatus(Types.ObjectId('123456789012345678901234'), '11111111111111'),
		);

		// Limit and new well should throw error
		matchingWells = [];
		req.params = { id: Types.ObjectId('123456789012345678901234').toString() };
		req.body = { api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null };
		project.wells = generateObjectIdArray(PROJECT_WELLS_LIMIT);
		await expect(putProjectWell(req, res)).rejects.toThrow(ProjectWellLimitError);
	});

	test('putProjectWells', async () => {
		const { req, res } = mockExpress();
		const project: ProjectResolved = {
			name: 'Test Project',
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			wells: [],
		};

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
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putProjectWells(req, res)).rejects.toThrow(RecordCountError);

		req.body = [{}];
		await putProjectWells(req, res);
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
		await putProjectWells(req, res);
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
		await putProjectWells(req, res);
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
		await putProjectWells(req, res);
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
		await putProjectWells(req, res);
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
		await putProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id4, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id42 = Types.ObjectId();
		req.body = [{ id: id42.toString(), chosenID: '11111111111111', dataSource: 'di' }];
		matchingWells = [{ _id: id42, chosenID: '11111111111111', dataSource: 'di' }];
		await putProjectWells(req, res);
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
		await putProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id5, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id6 = Types.ObjectId();
		req.body = [{ api14: '11111111111111', dataSource: 'di', abstract: null, perfLateralLength: null }];
		matchingWells = [{ _id: id6, chosenID: '11111111111111', dataSource: 'di' }];
		await putProjectWells(req, res);
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
		await putProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id62, '11111111111111')],
			successCount: 1,
			failedCount: 0,
		});

		const id7 = Types.ObjectId();
		req.body = [{ chosenID: '11111111111111', dataSource: 'internal', abstract: null, perfLateralLength: null }];
		matchingWells = [{ _id: id7, chosenID: '11111111111111', dataSource: 'internal' }];
		await putProjectWells(req, res);
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
		await putProjectWells(req, res);
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

		// Limit but all are update, so it should pass
		project.wells = generateObjectIdArray(PROJECT_WELLS_LIMIT);
		const id91 = Types.ObjectId();
		const id92 = Types.ObjectId();
		req.body = [
			{
				id: id91.toString(),
				chosenID: '11111111111111',
				wellName: 'updated well name 1',
				dataSource: 'internal',
			},
			{ chosenID: '33333333333333', wellName: 'updated well name 2', dataSource: 'internal' },
		];
		matchingWells = [
			{ _id: id91, chosenID: '11111111111111', dataSource: 'internal' },
			{ _id: id92, chosenID: '33333333333333', dataSource: 'internal' },
		];
		await putProjectWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(id91, '11111111111111'), getOkStatus(id92, '33333333333333')],
			successCount: 2,
			failedCount: 0,
		});

		// Limit and there are new wells, should throw limit exception
		project.wells = generateObjectIdArray(PROJECT_WELLS_LIMIT);
		const id101 = Types.ObjectId();
		const id102 = Types.ObjectId();
		req.body = [
			{
				id: id101.toString(),
				chosenID: '11111111111111',
				wellName: 'updated well name 1',
				dataSource: 'internal',
			},
			{ chosenID: '22222222222222', wellName: 'new well name 1', dataSource: 'internal' },
			{ chosenID: '33333333333333', wellName: 'updated well name 2', dataSource: 'internal' },
		];
		matchingWells = [
			{ _id: id101, chosenID: '11111111111111', dataSource: 'internal' },
			{ _id: id102, chosenID: '33333333333333', dataSource: 'internal' },
		];
		await expect(putProjectWells(req, res)).rejects.toThrow(ProjectWellLimitError);
	});

	test('deleteProjectWells', async () => {
		const { req, res } = mockExpress();
		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `/v1/projects/${project._id}/wells`;

		let result = 0;
		const serviceWell = jest.fn(() => result);

		res.locals = {
			service: {
				deleteProjectWells: serviceWell,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		let serviceCallTimes = serviceWell.mock.calls.length;
		await expect(deleteProjectWells(req, res)).rejects.toThrow(RequiredFilterError);
		// Service must not be called
		expect(serviceWell.mock.calls.length).toBe(serviceCallTimes);

		serviceCallTimes = serviceWell.mock.calls.length;
		req.query = { dataSource: 'internal' };
		await expect(deleteProjectWells(req, res)).rejects.toThrow(RequiredFilterError);
		// Service must not be called
		expect(serviceWell.mock.calls.length).toBe(serviceCallTimes);

		serviceCallTimes = serviceWell.mock.calls.length;
		req.query = { wellName: 'delete well' };
		result = 5;
		await expect(deleteProjectWells(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceWell.mock.calls.length).toBe(serviceCallTimes);

		req.query = { dataSource: 'internal', chosenID: '22222222222222' };
		result = 6;
		await deleteProjectWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(
			{ dataSource: ['internal'], chosenID: ['22222222222222'] },
			project,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});

		req.query = { dataSource: 'internal', chosenID: ['22222222222222', '33333333333333'] };
		result = 6;
		await deleteProjectWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(
			{
				dataSource: ['internal'],
				chosenID: ['22222222222222', '33333333333333'],
			},
			project,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});

		// Remove duplicates
		req.query = { id: ['123456789012345678901234', '123456789012345678901234'] };
		result = 6;
		await deleteProjectWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(
			{
				id: ['123456789012345678901234'],
			},
			project,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});

		// Remove duplicates
		req.query = { id: ['123456789012345678901234', '123456789012345678901235'] };
		result = 6;
		await deleteProjectWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(
			{
				id: ['123456789012345678901234', '123456789012345678901235'],
			},
			project,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});
	});

	test('deleteProjectWellById', async () => {
		const { req, res } = mockExpress();
		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `/v1/projects/${project._id}/wells`;

		const result = 1;
		const serviceWell = jest.fn(() => result);

		res.locals = {
			service: {
				deleteProjectWellById: serviceWell,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		req.params = { id: '5e272d38b78910dd2a1bd691' };

		await deleteProjectWellById(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(Types.ObjectId('5e272d38b78910dd2a1bd691'), project);
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '1',
		});
		expect(res.json).not.toHaveBeenCalled();

		req.params = { id: 'not-object-id' };
		await expect(deleteProjectWellById(req, res)).rejects.toThrow(TypeError);
	});
});
