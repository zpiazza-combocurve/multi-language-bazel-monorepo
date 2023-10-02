import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import {
	ApiMonthlyProduction,
	toApiMonthlyProduction,
	toISingleMonthlyProduction,
} from '@src/api/v1/monthly-productions/fields';
import {
	DifferentDataSourceError,
	FieldNameError,
	FieldNameFilterError,
	RecordCountError,
	RequestStructureError,
	RequiredFieldError,
	TypeError,
	ValidationError,
} from '@src/helpers/validation';
import { DuplicateProductionError, ProductionCollisionError } from '@src/api/v1/monthly-productions/validation';
import { generateDate, generateNumber, generateObjectId } from '@src/helpers/test/data-generation';
import { getCreatedStatus, getOkStatus } from '@src/helpers/test/multi-status/monthly-productions';
import { getErrorStatus, getMultiErrorStatus } from '@src/helpers/test/multi-status';
import { ISingleMonthlyProduction } from '@src/helpers/single-production';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { CursorType } from '../../pagination';
import { WellNotFoundError } from '../../wells/validation';

import {
	getProjectMonthlyProduction,
	getProjectMonthlyProductionHead,
	postProjectMonthlyProduction,
	putProjectMonthlyProduction,
} from './controllers';
import { READ_RECORD_LIMIT, WRITE_RECORD_LIMIT } from './fields';

import { mockExpress } from '@test/express-mocks';

const { MULTI_STATUS } = StatusCodes;

const getMonthlyProds = (n = 1, dayOfMonth = 15) =>
	[...Array(n).keys()].map((i) => ({
		well: generateObjectId(i),
		date: generateDate(dayOfMonth, i),
		oil: generateNumber(i),
	}));

const getMonthlyProdsJson = (n = 1, dayOfMonth = 15) =>
	getMonthlyProds(n, dayOfMonth).map(({ well, date, ...rest }) => ({
		well: well.toString(),
		date: date.toISOString(),
		...rest,
	}));

describe('v1/projects/monthly-productions/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getProjectMonthlyProductionHead throws validation error', async () => {
		const { req, res } = mockExpress();
		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/monthly-productions`;

		res.locals = {
			service: {
				getMonthlyProductionCount: () => 0,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProjectMonthlyProductionHead, READ_RECORD_LIMIT);
	});

	test('getProjectMonthlyProductionHead runs correctly', async () => {
		const { req, res } = mockExpress();
		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/monthly-productions`;

		req.originalUrl = originalUrl;

		let count = 0;
		const getMonthlyProductionCount = jest.fn(() => count);

		res.locals = {
			service: {
				getMonthlyProductionCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getProjectMonthlyProductionHead(req, res);
		expect(getMonthlyProductionCount).toHaveBeenLastCalledWith({}, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getProjectMonthlyProductionHead(req, res);
		expect(getMonthlyProductionCount).toHaveBeenLastCalledWith({}, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getProjectMonthlyProductionHead(req, res);
		expect(getMonthlyProductionCount).toHaveBeenLastCalledWith({}, project._id);
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
		await getProjectMonthlyProductionHead(req, res);
		expect(getMonthlyProductionCount).toHaveBeenLastCalledWith({}, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', well: '123456789012345678901234' };
		count = 35;
		await getProjectMonthlyProductionHead(req, res);
		expect(getMonthlyProductionCount).toHaveBeenLastCalledWith({ well: ['123456789012345678901234'] }, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getMonthlyProductionCount.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '123456789012345678901234', a: 'b' };
		count = 35;
		await expect(getProjectMonthlyProductionHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getMonthlyProductionCount.mock.calls.length).toBe(serviceCallTimes);
	});

	test('getProjectMonthlyProduction throws validation error', async () => {
		const { req, res } = mockExpress();
		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/monthly-productions`;

		res.locals = {
			service: {
				getMonthlyProduction: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProjectMonthlyProduction, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['date'] };
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=date' };
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>date' };
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+date' };
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(ValidationError);
	});

	test('getProjectMonthlyProduction runs correctly', async () => {
		const { req, res } = mockExpress();
		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/monthly-productions`;

		req.originalUrl = originalUrl;

		let result: ApiMonthlyProduction[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceMonthlyProduction = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getMonthlyProduction: serviceMonthlyProduction,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(0, 25, {}, {}, undefined, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getMonthlyProds(3);
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(0, 25, {}, {}, undefined, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getMonthlyProds(3));

		result = getMonthlyProds(25);
		hasNext = true;
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(0, 25, {}, {}, undefined, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getMonthlyProds(25));

		req.query = { skip: '25' };
		result = getMonthlyProds(25);
		hasNext = true;
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(25, 25, {}, {}, undefined, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getMonthlyProds(25));

		req.query = { skip: '30', take: '10' };
		result = getMonthlyProds(5);
		hasNext = false;
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(30, 10, {}, {}, undefined, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', well: '123456789012345678901234' };
		result = getMonthlyProds(5);
		hasNext = false;
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(
			30,
			10,
			{},
			{ well: ['123456789012345678901234'] },
			undefined,
			project._id,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		let serviceCallTimes = serviceMonthlyProduction.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '123456789012345678901234', a: 'b' };
		result = getMonthlyProds(5);
		hasNext = false;
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceMonthlyProduction.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', well: '123456789012345678901234', sort: '-well' };
		result = getMonthlyProds(5);
		hasNext = false;
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(
			30,
			10,
			{ well: -1 },
			{ well: ['123456789012345678901234'] },
			undefined,
			project._id,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		serviceCallTimes = serviceMonthlyProduction.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '123456789012345678901234', a: 'b', sort: 'date' };
		result = getMonthlyProds(5);
		hasNext = false;
		await expect(getProjectMonthlyProduction(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceMonthlyProduction.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', well: '123456789012345678901234', sort: '+date' };
		result = getMonthlyProds(5);
		hasNext = false;
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(
			30,
			10,
			{ date: 1 },
			{ well: ['123456789012345678901234'] },
			undefined,
			project._id,
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
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(
			0,
			10,
			{},
			{},
			'123456789012345678901234',
			project._id,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getMonthlyProds(10);
		hasNext = true;
		cursor = Types.ObjectId();
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(0, 10, {}, {}, undefined, project._id);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', well: '5e272d7ab78910dd2a1dfdc3', sort: '+well' };
		result = getMonthlyProds(10);
		hasNext = true;
		cursor = null;
		await getProjectMonthlyProduction(req, res);
		expect(serviceMonthlyProduction).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: 1 },
			{ well: ['5e272d7ab78910dd2a1dfdc3'] },
			undefined,
			project._id,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});
	test('postProjectMonthlyProduction causes validation error', async () => {
		const { req, res } = mockExpress();
		const project = { name: 'TestProject', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		let collision: ISingleMonthlyProduction[] = [];
		let getId = ({ well }: ApiMonthlyProduction): Types.ObjectId | undefined => well || Types.ObjectId();

		res.locals = {
			service: {
				create: (prod: Array<ISingleMonthlyProduction | undefined>) => ({
					results: prod.map((p) => p && getCreatedStatus(toApiMonthlyProduction(p))),
				}),
				findMatches: () => collision,
				getWellsIds: (prods: Array<ApiMonthlyProduction | undefined>) =>
					prods.map((p) => p && { ...p, well: getId(p) }),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postProjectMonthlyProduction(req, res)).rejects.toThrow(RecordCountError);

		req.body = { well: '123456789012345678901234', date: '2000-01-01', a: 'b' };
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [{ well: '123456789012345678901234', date: '2000-01-01', a: 'b' }];
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `date`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `dataSource`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { well: '123456789012345678901234' };
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `date`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { date: '2000-01-01' };
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `dataSource`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { dataSource: 'internal', date: '2000-01-01' };
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { chosenID: '11111111111111', date: '2000-01-01' };
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus(
					[
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `dataSource`',
							location: '[0]',
							chosenID: '11111111111111',
						},
					],
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { well: '123456789012345678901234', date: 42 };
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: TypeError.name, message: '`42` is not a valid ISO date', location: '[0].date' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { well: '123456789012345678901234', date: '2000-01-01', oil: 'fourty two' };
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(TypeError.name, '`fourty two` is not a valid number', '[0].oil')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...getMonthlyProdsJson(), ...getMonthlyProdsJson()];
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateProductionError.name,
					'More than one production data supplied for well `000000000000000000000000` in `2000-01`',
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateProductionError.name,
					'More than one production data supplied for well `000000000000000000000000` in `2000-01`',
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		collision = [toISingleMonthlyProduction(getMonthlyProds()[0])];
		req.body = [...getMonthlyProdsJson()];
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					ProductionCollisionError.name,
					'Production data for well `000000000000000000000000` in `2000-01` already exist',
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		const wellId = Types.ObjectId();
		getId = () => wellId;
		const prod1 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod1AsApiWell = { ...prod1, date: new Date('2000-01-15'), well: wellId };
		req.body = [prod1, { dataSource: 'di', chosenID: '22222222222222', date: '2000-01-01', oil: 42 }];
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getCreatedStatus(prod1AsApiWell),
				getErrorStatus(
					DifferentDataSourceError.name,
					'Different data source found: `di`. All records in a request must be from the same data source.',
					'[1]',
					'22222222222222',
				),
			],
			successCount: 1,
			failedCount: 1,
		});

		getId = () => undefined;
		req.body = [
			{ dataSource: 'di', chosenID: '22222222222222', date: '2000-01-01', oil: 42 },
			{ well: '123456789012345678901234', date: '2000-01-01', oil: 42 },
		];
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with data source `di` and chosen id `22222222222222` in project `5e272bed4b97ed00132f2271:' +
						project.name +
						'`',
					'[0]',
					'22222222222222',
				),
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with id `123456789012345678901234` in project `5e272bed4b97ed00132f2271:' +
						project.name +
						'`',
					'[1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	test('postProjectMonthlyProduction runs correctly', async () => {
		const { req, res } = mockExpress();
		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const projectId = project._id.toString();

		const wellId: Types.ObjectId | undefined = Types.ObjectId();

		const create = jest.fn((prod: Array<ISingleMonthlyProduction | undefined>) => ({
			results: prod.map((p) => p && getCreatedStatus(toApiMonthlyProduction(p))),
		}));
		res.locals = {
			service: {
				create,
				findMatches: () => [],
				getWellsIds: (prods: Array<ApiMonthlyProduction | undefined>) =>
					prods.map((p) => (!p || p.well ? p : { ...p, well: wellId })),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = getMonthlyProdsJson()[0];
		await postProjectMonthlyProduction(req, res);
		expect(create).toHaveBeenLastCalledWith([toISingleMonthlyProduction(getMonthlyProds()[0])], projectId);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(getMonthlyProds()[0])],
			successCount: 1,
			failedCount: 0,
		});

		req.body = { ...getMonthlyProdsJson()[0], gas: null };
		await postProjectMonthlyProduction(req, res);
		expect(create).toHaveBeenLastCalledWith([toISingleMonthlyProduction(getMonthlyProds()[0])], projectId);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(getMonthlyProds()[0])],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getMonthlyProdsJson(10);
		await postProjectMonthlyProduction(req, res);
		expect(create).toHaveBeenLastCalledWith(getMonthlyProds(10).map(toISingleMonthlyProduction), projectId);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getMonthlyProds(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});

		req.body = getMonthlyProdsJson(1, 1)[0];
		await postProjectMonthlyProduction(req, res);
		expect(create).toHaveBeenLastCalledWith([toISingleMonthlyProduction(getMonthlyProds(1, 15)[0])], projectId);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(getMonthlyProds(1, 15)[0])],
			successCount: 1,
			failedCount: 0,
		});

		const prod1 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod1AsApiWell = { ...prod1, date: new Date('2000-01-15'), well: wellId };
		req.body = [prod1];
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(prod1AsApiWell)],
			successCount: 1,
			failedCount: 0,
		});

		const prod21 = { well: '123456789012345678901234', date: '2000-01-01', oil: 42 };
		const prod22 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod21AsApiWell = { ...prod21, date: new Date('2000-01-15'), well: Types.ObjectId(prod21.well) };
		const prod22AsApiWell = { ...prod22, date: new Date('2000-01-15'), well: wellId };
		req.body = [prod21, prod22];
		await postProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(prod21AsApiWell), getCreatedStatus(prod22AsApiWell)],
			successCount: 2,
			failedCount: 0,
		});
	});

	test('putProjectMonthlyProduction causes validation error', async () => {
		const { req, res } = mockExpress();
		const project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		let getId = ({ well }: ApiMonthlyProduction): Types.ObjectId | undefined => well || Types.ObjectId();

		res.locals = {
			service: {
				upsert: (prod: Array<ISingleMonthlyProduction | undefined>) => ({
					results: prod.map((p) => p && getOkStatus(toApiMonthlyProduction(p))),
				}),
				getWellsIds: (prods: Array<ApiMonthlyProduction | undefined>) =>
					prods.map((p) => p && { ...p, well: getId(p) }),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putProjectMonthlyProduction(req, res)).rejects.toThrow(RecordCountError);

		req.body = { well: '123456789012345678901234', date: '2000-01-01', a: 'b' };
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [{ well: '123456789012345678901234', date: '2000-01-01', a: 'b' }];
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `date`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `dataSource`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { well: '123456789012345678901234' };
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `date`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { date: '2000-01-01' };
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `dataSource`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { dataSource: 'internal', date: '2000-01-01' };
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { chosenID: '11111111111111', date: '2000-01-01' };
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus(
					[
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `dataSource`',
							location: '[0]',
							chosenID: '11111111111111',
						},
					],
					'11111111111111',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { well: '123456789012345678901234', date: 42 };
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: TypeError.name, message: '`42` is not a valid ISO date', location: '[0].date' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { well: '123456789012345678901234', date: '2000-01-01', oil: 'fourty two' };
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(TypeError.name, '`fourty two` is not a valid number', '[0].oil')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...getMonthlyProdsJson(), ...getMonthlyProdsJson()];
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateProductionError.name,
					'More than one production data supplied for well `000000000000000000000000` in `2000-01`',
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateProductionError.name,
					'More than one production data supplied for well `000000000000000000000000` in `2000-01`',
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		const wellId = Types.ObjectId();
		getId = () => wellId;
		const prod1 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod1AsApiWell = { ...prod1, date: new Date('2000-01-15'), well: wellId };
		req.body = [prod1, { dataSource: 'di', chosenID: '22222222222222', date: '2000-01-01', oil: 42 }];
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getOkStatus(prod1AsApiWell),
				getErrorStatus(
					DifferentDataSourceError.name,
					'Different data source found: `di`. All records in a request must be from the same data source.',
					'[1]',
					'22222222222222',
				),
			],
			successCount: 1,
			failedCount: 1,
		});

		getId = () => undefined;
		req.body = [
			{ dataSource: 'di', chosenID: '22222222222222', date: '2000-01-01', oil: 42 },
			{ well: '123456789012345678901234', date: '2000-01-01', oil: 42 },
		];
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with data source `di` and chosen id `22222222222222` in project `5e272bed4b97ed00132f2271:' +
						project.name +
						'`',
					'[0]',
					'22222222222222',
				),
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with id `123456789012345678901234` in project `5e272bed4b97ed00132f2271:' +
						project.name +
						'`',
					'[1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	test('putProjectMonthlyProduction runs correctly', async () => {
		const { req, res } = mockExpress();
		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const projectId = project._id.toString();

		const wellId: Types.ObjectId | undefined = Types.ObjectId();

		const upsert = jest.fn((prod: Array<ISingleMonthlyProduction | undefined>) => ({
			results: prod.map((p) => p && getOkStatus(toApiMonthlyProduction(p))),
		}));
		res.locals = {
			service: {
				upsert,
				findMatches: () => [],
				getWellsIds: (prods: Array<ApiMonthlyProduction | undefined>) =>
					prods.map((p) => (!p || p.well ? p : { ...p, well: wellId })),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = getMonthlyProdsJson()[0];
		await putProjectMonthlyProduction(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toISingleMonthlyProduction(getMonthlyProds()[0])], projectId);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(getMonthlyProds()[0])],
			successCount: 1,
			failedCount: 0,
		});

		req.body = { ...getMonthlyProdsJson()[0], gas: null };
		await putProjectMonthlyProduction(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toISingleMonthlyProduction(getMonthlyProds()[0])], projectId);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(getMonthlyProds()[0])],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getMonthlyProdsJson(10);
		await putProjectMonthlyProduction(req, res);
		expect(upsert).toHaveBeenLastCalledWith(getMonthlyProds(10).map(toISingleMonthlyProduction), projectId);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getMonthlyProds(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});

		req.body = getMonthlyProdsJson(1, 1)[0];
		await putProjectMonthlyProduction(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toISingleMonthlyProduction(getMonthlyProds(1, 15)[0])], projectId);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(getMonthlyProds(1, 15)[0])],
			successCount: 1,
			failedCount: 0,
		});

		const prod1 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod1AsApiWell = { ...prod1, date: new Date('2000-01-15'), well: wellId };
		req.body = [prod1];
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(prod1AsApiWell)],
			successCount: 1,
			failedCount: 0,
		});

		const prod21 = { well: '123456789012345678901234', date: '2000-01-01', oil: 42 };
		const prod22 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod21AsApiWell = { ...prod21, date: new Date('2000-01-15'), well: Types.ObjectId(prod21.well) };
		const prod22AsApiWell = { ...prod22, date: new Date('2000-01-15'), well: wellId };
		req.body = [prod21, prod22];
		await putProjectMonthlyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(prod21AsApiWell), getOkStatus(prod22AsApiWell)],
			successCount: 2,
			failedCount: 0,
		});
	});
});
