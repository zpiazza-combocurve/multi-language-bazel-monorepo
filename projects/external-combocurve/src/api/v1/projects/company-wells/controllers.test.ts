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
import { DuplicateIdentifierError, WellExistsError, WellNotFoundError } from '@src/api/v1/wells/validation';
import {
	generateEnum,
	generateObjectId,
	generateObjectIdArray,
	generateString,
} from '@src/helpers/test/data-generation';
import { getErrorStatus, getMultiErrorStatus } from '@src/helpers/test/multi-status';
import { ApiWell } from '@src/api/v1/wells/fields';
import { CursorType } from '@src/api/v1/pagination';
import { getCreatedStatus } from '@src/helpers/test/multi-status/project-company-wells';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { PROJECT_WELLS_LIMIT, ProjectWellLimitError } from '../validation';

import {
	deleteProjectCompanyWells,
	getProjectCompanyWellById,
	getProjectCompanyWells,
	getProjectCompanyWellsHead,
	postProjectCompanyWells,
} from './controllers';
import { IProjectCompanyWell, READ_RECORD_LIMIT, WRITE_RECORD_LIMIT } from './fields';

import { mockExpress } from '@test/express-mocks';

const { MULTI_STATUS } = StatusCodes;

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

describe('v1/projects/:projectId/company-wells/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getProjectCompanyWellsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/company-wells';

		res.locals = {
			service: {
				getWellsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProjectCompanyWellsHead, READ_RECORD_LIMIT);
	});

	test('getProjectCompanyWellsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/company-wells`;

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

		await getProjectCompanyWellsHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getProjectCompanyWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith({}, { project, company: true });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getProjectCompanyWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith({}, { project, company: true });
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
		await getProjectCompanyWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith({}, { project, company: true });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', wellName: 'BRISCOE' };
		count = 35;
		await getProjectCompanyWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith({ wellName: ['BRISCOE'] }, { project, company: true });
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
		await expect(getProjectCompanyWellsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getWellsCount.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', wellName: 'BRISCOE', api14: '42479392700000' };
		count = 35;
		await getProjectCompanyWellsHead(req, res);
		expect(getWellsCount).toHaveBeenLastCalledWith(
			{ wellName: ['BRISCOE'], api14: ['42479392700000'] },
			{ project, company: true },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});
	});

	test('getProjectCompanyWells throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/company-wells`;

		res.locals = {
			service: {
				getWells: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProjectCompanyWells, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['api14'] };
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=api14' };
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>api14' };
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+api14' };
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(ValidationError);
	});

	test('getProjectCompanyWells runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/company-wells`;

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

		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 25, sort: { id: -1 }, filters: {} },
			{ project, company: true },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getWellArray(3);
		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 25, sort: { id: -1 }, filters: {} },
			{ project, company: true },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getWellArray(3));

		result = getWellArray(25);
		hasNext = true;
		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 25, sort: { id: -1 }, filters: {} },
			{ project, company: true },
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
		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 25, take: 25, sort: { id: -1 }, filters: {} },
			{ project, company: true },
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
		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 30, take: 10, sort: { id: -1 }, filters: {} },
			{ project, company: true },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', wellName: 'BRISCOE' };
		result = getWellArray(5);
		hasNext = false;
		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 30, take: 10, sort: { id: -1 }, filters: { wellName: ['BRISCOE'] } },
			{ project, company: true },
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
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceProjectWell.mock.calls.length).toBe(serviceCallTimes);

		serviceCallTimes = serviceProjectWell.mock.calls.length;
		req.query = { skip: '30', take: '10', wellName: 'BRISCOE', a: 'b', sort: '-api14' };
		result = getWellArray(5);
		hasNext = false;
		await expect(getProjectCompanyWells(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceProjectWell.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', wellName: 'BRISCOE', api14: '42479392700000', sort: '-api14' };
		result = getWellArray(5);
		hasNext = false;
		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 30, take: 10, sort: { api14: -1 }, filters: { wellName: ['BRISCOE'], api14: ['42479392700000'] } },
			{ project, company: true },
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
		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 10, sort: { id: -1 }, filters: {}, cursor: '123456789012345678901234' },
			{ project, company: true },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getWellArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 10, sort: { id: -1 }, filters: {}, cursor: undefined },
			{ project, company: true },
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
		await getProjectCompanyWells(req, res);
		expect(serviceProjectWell).toHaveBeenLastCalledWith(
			{ skip: 0, take: 10, sort: { wellName: 1 }, filters: { wellName: ['default1'] }, cursor: undefined },
			{ project, company: true },
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});

	test('getProjectCompanyWellById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getProjectCompanyWellById(req, res)).rejects.toThrow(WellNotFoundError);
	});

	test('postProjectCompanyWells', async () => {
		const { req, res } = mockExpress();

		const project = {
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			name: 'Test Project',
			wells: [
				Types.ObjectId('5e272d38b78910dd3a1bd691'),
				Types.ObjectId('5e272d38b78910dd3a1bd692'),
				Types.ObjectId('5e272d38b78910dd2a1bd693'),
			],
		};

		const originalUrl = `projects/${project._id}/company-wells`;

		req.originalUrl = originalUrl;
		let matchingWells: Partial<IWell>[] = [];
		res.locals = {
			service: {
				getMatchingWellsMixed: () => matchingWells,
				addCompanyWellsToProject: (wells: Array<IProjectCompanyWell | undefined>) => ({
					results: wells.map((w) => w && getCreatedStatus(w.dataSource, w.chosenID, w._id.toString())),
				}),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid well data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postProjectCompanyWells(req, res)).rejects.toThrow(RecordCountError);

		matchingWells = [
			{ chosenID: '11111111111111', dataSource: 'di', _id: Types.ObjectId('123456789012345678901234') },
		];
		req.body = [
			{ chosenID: '11111111111111', dataSource: 'di' },
			{ chosenID: '11111111111111', dataSource: 'di' },
		];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: dataSource: `di`, id: `123456789012345678901234`, chosenID: `11111111111111`',
					'[0], [1]',
					'11111111111111',
				),
				getErrorStatus(
					DuplicateIdentifierError.name,
					'Duplicate identifier value: dataSource: `di`, id: `123456789012345678901234`, chosenID: `11111111111111`',
					'[0], [1]',
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		matchingWells = [];
		req.body = [
			{ chosenID: 'nonexisting', dataSource: 'di' },
			{ chosenID: 'nonexisting2', dataSource: 'di' },
		];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with data source `di` and chosen id `nonexisting` in company scope',
					'[0]',
					'nonexisting',
				),
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with data source `di` and chosen id `nonexisting2` in company scope',
					'[1]',
					'nonexisting2',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		matchingWells = [];
		req.body = [
			{ chosenID: 'nonexisting', dataSource: 'di' },
			{ chosenID: 'nonexisting', dataSource: 'di' },
		];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus(
					[
						{
							name: DuplicateIdentifierError.name,
							message: 'Duplicate identifier value: dataSource: `di`, chosenID: `nonexisting`',
							location: '[0], [1]',
							chosenID: 'nonexisting',
						},
						{
							name: WellNotFoundError.name,
							message:
								'No well was found with data source `di` and chosen id `nonexisting` in company scope',
							location: '[0], [1]',
							chosenID: 'nonexisting',
						},
					],
					'nonexisting',
				),
				getMultiErrorStatus(
					[
						{
							name: DuplicateIdentifierError.name,
							message: 'Duplicate identifier value: dataSource: `di`, chosenID: `nonexisting`',
							location: '[0], [1]',
							chosenID: 'nonexisting',
						},
						{
							name: WellNotFoundError.name,
							message:
								'No well was found with data source `di` and chosen id `nonexisting` in company scope',
							location: '[0], [1]',
							chosenID: 'nonexisting',
						},
					],
					'nonexisting',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		matchingWells = [];
		req.body = [
			{ id: '012345678901234567890123', dataSource: 'di' },
			{ id: '012345678901234567890124', dataSource: 'di' },
		];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with id `012345678901234567890123` in company scope',
					'[0]',
				),
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with id `012345678901234567890124` in company scope',
					'[1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		matchingWells = [];
		req.body = [
			{ id: '012345678901234567890123', dataSource: 'di' },
			{ id: '012345678901234567890123', dataSource: 'di' },
		];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: DuplicateIdentifierError.name,
						message: 'Duplicate identifier value: dataSource: `di`, id: `012345678901234567890123`',
						location: '[0], [1]',
					},
					{
						name: WellNotFoundError.name,
						message: 'No well was found with id `012345678901234567890123` in company scope',
						location: '[0], [1]',
					},
				]),
				getMultiErrorStatus([
					{
						name: DuplicateIdentifierError.name,
						message: 'Duplicate identifier value: dataSource: `di`, id: `012345678901234567890123`',
						location: '[0], [1]',
					},
					{
						name: WellNotFoundError.name,
						message: 'No well was found with id `012345678901234567890123` in company scope',
						location: '[0], [1]',
					},
				]),
			],
			successCount: 0,
			failedCount: 2,
		});

		matchingWells = [
			{ chosenID: '11111111111111', dataSource: 'di', _id: Types.ObjectId('5e272d38b78910dd3a1bd691') },
			{ chosenID: '22222222222222', dataSource: 'di', _id: Types.ObjectId('123456789012345678901234') },
		];
		req.body = [
			{ chosenID: '11111111111111', dataSource: 'di' },
			{ chosenID: '22222222222222', dataSource: 'di' },
		];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellExistsError.name,
					'Well with identifier id: `5e272d38b78910dd3a1bd691`, dataSource: `di` and chosenID: `11111111111111` already exists in project `5e272bed4b97ed00132f2271:' +
						project.name +
						'`',
					'[0]',
					'11111111111111',
				),
				getCreatedStatus('di', '22222222222222', '123456789012345678901234'),
			],
			successCount: 1,
			failedCount: 1,
		});

		matchingWells = [
			{ chosenID: '11111111111111', dataSource: 'di', _id: Types.ObjectId('5e272d38b78910dd3a1bd691') },
			{ chosenID: '22222222222222', dataSource: 'di', _id: Types.ObjectId('5e272d38b78910dd3a1bd692') },
		];
		req.body = [
			{ chosenID: '11111111111111', dataSource: 'di' },
			{ chosenID: '22222222222222', dataSource: 'di' },
		];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellExistsError.name,
					'Well with identifier id: `5e272d38b78910dd3a1bd691`, dataSource: `di` and chosenID: `11111111111111` already exists in project `5e272bed4b97ed00132f2271:' +
						project.name +
						'`',
					'[0]',
					'11111111111111',
				),
				getErrorStatus(
					WellExistsError.name,
					'Well with identifier id: `5e272d38b78910dd3a1bd692`, dataSource: `di` and chosenID: `22222222222222` already exists in project `5e272bed4b97ed00132f2271:' +
						project.name +
						'`',
					'[1]',
					'22222222222222',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		matchingWells = [
			{ chosenID: '11111111111111', dataSource: 'di', _id: Types.ObjectId('123456789012345678901234') },
		];
		req.body = [{ dataSource: 'di' }, { id: '5e272d38b78910dd3a1bd692', dataSource: 'di' }];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(RequiredFieldError.name, 'Missing required field: `chosenID`', '[0]'),
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with id `5e272d38b78910dd3a1bd692` in company scope',
					'[1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		matchingWells = [
			{ chosenID: '11111111111111', dataSource: 'di', _id: Types.ObjectId('123456789012345678901234') },
		];
		req.body = [
			{ chosenID: '11111111111111', dataSource: 'di' },
			{ chosenID: '22222222222222', dataSource: 'other' },
		];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getCreatedStatus('di', '11111111111111', '123456789012345678901234'),
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

		matchingWells = [
			{ chosenID: '11111111111111', dataSource: 'di', _id: Types.ObjectId('123456789012345678901234') },
		];
		req.body = [{ chosenID: '11111111111111', dataSource: 'di' }];
		await postProjectCompanyWells(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus('di', '11111111111111', '123456789012345678901234')],
			successCount: 1,
			failedCount: 0,
		});

		matchingWells = [
			{ chosenID: '11111111111111', dataSource: 'di', _id: Types.ObjectId('123456789012345678901234') },
		];
		req.body = [{ chosenID: '11111111111111', dataSource: 'di' }];
		project.wells = generateObjectIdArray(PROJECT_WELLS_LIMIT);
		await expect(postProjectCompanyWells(req, res)).rejects.toThrow(ProjectWellLimitError);
	});

	test('deleteProjectCompanyWells', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/company-wells`;

		let result = 0;
		const serviceWell = jest.fn(() => result);

		res.locals = {
			service: {
				deleteCompanyWellsFromProject: serviceWell,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		let serviceCallTimes = serviceWell.mock.calls.length;
		await expect(deleteProjectCompanyWells(req, res)).rejects.toThrow(RequiredFilterError);
		// Service must not be called
		expect(serviceWell.mock.calls.length).toBe(serviceCallTimes);

		serviceCallTimes = serviceWell.mock.calls.length;
		req.query = { dataSource: 'internal' };
		await expect(deleteProjectCompanyWells(req, res)).rejects.toThrow(RequiredFilterError);
		// Service must not be called
		expect(serviceWell.mock.calls.length).toBe(serviceCallTimes);

		serviceCallTimes = serviceWell.mock.calls.length;
		req.query = { wellName: 'delete well' };
		result = 5;
		await expect(deleteProjectCompanyWells(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceWell.mock.calls.length).toBe(serviceCallTimes);

		req.query = { dataSource: 'internal', chosenID: '22222222222222' };
		result = 6;
		await deleteProjectCompanyWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(
			{ dataSource: ['internal'], chosenID: ['22222222222222'] },
			project,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});

		req.query = { dataSource: 'internal', chosenID: ['22222222222222', '33333333333333'] };
		result = 6;
		await deleteProjectCompanyWells(req, res);
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
		await deleteProjectCompanyWells(req, res);
		expect(serviceWell).toHaveBeenLastCalledWith(
			{
				id: ['123456789012345678901234'],
			},
			project,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '6',
		});

		req.query = { id: ['123456789012345678901234', '123456789012345678901235'] };
		result = 6;
		await deleteProjectCompanyWells(req, res);
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
});
