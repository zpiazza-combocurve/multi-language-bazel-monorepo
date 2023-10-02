import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

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
import { generateDate, generateNumber, generateObjectId } from '@src/helpers/test/data-generation';
import { getCreatedStatus, getOkStatus } from '@src/helpers/test/multi-status/daily-productions';
import { getErrorStatus, getMultiErrorStatus } from '@src/helpers/test/multi-status';
import { ISingleDailyProduction } from '@src/helpers/single-production';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { CursorType } from '../pagination';
import { WellNotFoundError } from '../wells/validation';

import {
	ApiDailyProduction,
	READ_RECORD_LIMIT,
	toApiDailyProduction,
	toISingleDailyProduction,
	WRITE_RECORD_LIMIT,
} from './fields';
import {
	deleteDailyProduction,
	getDailyProduction,
	getDailyProductionHead,
	postDailyProduction,
	putDailyProduction,
} from './controllers';
import { DuplicateProductionError, ProductionCollisionError } from './validation';

import { mockExpress } from '@test/express-mocks';
const { MULTI_STATUS } = StatusCodes;
const getDailyProds = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		well: generateObjectId(i),
		date: generateDate(i + 1),
		oil: generateNumber(i + 1),
	}));

const getDailyProdsJson = (n = 1) =>
	getDailyProds(n).map(({ well, date, ...rest }) => ({
		well: well.toString(),
		date: date.toISOString(),
		...rest,
	}));

describe('v1/daily-productions/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getDailyProductionHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'daily-productions';

		res.locals = {
			service: {
				getDailyProductionCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getDailyProductionHead, READ_RECORD_LIMIT);
	});

	test('getDailyProductionHead runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'daily-productions';

		let count = 0;
		const getDailyProductionCount = jest.fn(() => count);

		res.locals = {
			service: {
				getDailyProductionCount,
			},
		};
		res.set = jest.fn(() => res);

		await getDailyProductionHead(req, res);
		expect(getDailyProductionCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="last"',
			'X-Query-Count': '0',
		});

		count = 51;
		await getDailyProductionHead(req, res);
		expect(getDailyProductionCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=25&take=25>;rel="next",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/daily-productions?skip=50&take=25>;rel="last"',
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getDailyProductionHead(req, res);
		expect(getDailyProductionCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=50&take=25>;rel="next",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="prev",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/daily-productions?skip=50&take=25>;rel="last"',
			'X-Query-Count': '51',
		});

		req.query = { skip: '30', take: '10' };
		count = 35;
		await getDailyProductionHead(req, res);
		expect(getDailyProductionCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=10>;rel="first",' +
				'<http://www.localhost.com/daily-productions?skip=30&take=10>;rel="last"',
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', well: '123456789012345678901234' };
		count = 35;
		await getDailyProductionHead(req, res);
		expect(getDailyProductionCount).toHaveBeenLastCalledWith({ well: ['123456789012345678901234'] });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=10>;rel="first",' +
				'<http://www.localhost.com/daily-productions?skip=30&take=10>;rel="last"',
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getDailyProductionCount.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '123456789012345678901234', a: 'b' };
		count = 35;
		await expect(getDailyProductionHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getDailyProductionCount.mock.calls.length).toBe(serviceCallTimes);
	});

	test('getDailyProduction throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'daily-productions';

		res.locals = {
			service: {
				getDailyProduction: () => ({ result: [], hasNext: false }),
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getDailyProduction, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getDailyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['date'] };
		await expect(getDailyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getDailyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getDailyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=date' };
		await expect(getDailyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>date' };
		await expect(getDailyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+date' };
		await expect(getDailyProduction(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getDailyProduction(req, res)).rejects.toThrow(ValidationError);
	});

	test('getDailyProduction runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'daily-productions';

		let result: ApiDailyProduction[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceDailyProduction = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getDailyProduction: serviceDailyProduction,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(0, 25, {}, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: '<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getDailyProds(3);
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(0, 25, {}, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: '<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getDailyProds(3));

		result = getDailyProds(25);
		hasNext = true;
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(0, 25, {}, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=25&take=25>;rel="next",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getDailyProds(25));

		req.query = { skip: '25' };
		result = getDailyProds(25);
		hasNext = true;
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(25, 25, {}, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=50&take=25>;rel="next",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="prev",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getDailyProds(25));

		req.query = { skip: '30', take: '10' };
		result = getDailyProds(5);
		hasNext = false;
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(30, 10, {}, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=10>;rel="first"',
		});

		req.query = { skip: '30', take: '10', well: '123456789012345678901234' };
		result = getDailyProds(5);
		hasNext = false;
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(
			30,
			10,
			{},
			{ well: ['123456789012345678901234'] },
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=10>;rel="first"',
		});

		let serviceCallTimes = serviceDailyProduction.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '123456789012345678901234', a: 'b' };
		result = getDailyProds(5);
		hasNext = false;
		await expect(getDailyProduction(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceDailyProduction.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', well: '123456789012345678901234', sort: '-well' };
		result = getDailyProds(5);
		hasNext = false;
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(
			30,
			10,
			{ well: -1 },
			{ well: ['123456789012345678901234'] },
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=10>;rel="first"',
		});

		serviceCallTimes = serviceDailyProduction.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '123456789012345678901234', a: 'b', sort: 'date' };
		result = getDailyProds(5);
		hasNext = false;
		await expect(getDailyProduction(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceDailyProduction.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', well: '123456789012345678901234', sort: '+date' };
		result = getDailyProds(5);
		hasNext = false;
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(
			30,
			10,
			{ date: 1 },
			{ well: ['123456789012345678901234'] },
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/daily-productions?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/daily-productions?skip=0&take=10>;rel="first"',
		});

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(0, 10, {}, {}, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/daily-productions?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getDailyProds(10);
		hasNext = true;
		cursor = Types.ObjectId();
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(0, 10, {}, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/daily-productions?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/daily-productions?take=10>;rel="first"`,
		});

		req.query = { take: '10', well: '5e272d7ab78910dd2a1dfdc3', sort: '+well' };
		result = getDailyProds(10);
		hasNext = true;
		cursor = null;
		await getDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: 1 },
			{ well: ['5e272d7ab78910dd2a1dfdc3'] },
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/daily-productions?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/daily-productions?skip=0&take=10>;rel="first"`,
		});
	});

	test('postDailyProduction causes validation error', async () => {
		const { req, res } = mockExpress();

		let collision: ISingleDailyProduction[] = [];
		let getId = ({ well }: ApiDailyProduction): Types.ObjectId | undefined => well || Types.ObjectId();

		res.locals = {
			service: {
				create: (prod: Array<ISingleDailyProduction | undefined>) => ({
					results: prod.map((p) => p && getCreatedStatus(toApiDailyProduction(p))),
				}),
				findMatches: () => collision,
				getWellsIds: (prods: Array<ApiDailyProduction | undefined>) =>
					prods.map((p) => p && { ...p, well: getId(p) }),
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postDailyProduction(req, res)).rejects.toThrow(RecordCountError);

		req.body = { well: '123456789012345678901234', date: '2000-01-01', a: 'b' };
		await postDailyProduction(req, res);
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
		await postDailyProduction(req, res);
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
		await postDailyProduction(req, res);
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
		await postDailyProduction(req, res);
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
		await postDailyProduction(req, res);
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
		await postDailyProduction(req, res);
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
		await postDailyProduction(req, res);
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
		await postDailyProduction(req, res);
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
		await postDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(TypeError.name, '`fourty two` is not a valid number', '[0].oil')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...getDailyProdsJson(), ...getDailyProdsJson()];
		await postDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateProductionError.name,
					'More than one production data supplied for well `000000000000000000000000` in `2000-01-01`',
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateProductionError.name,
					'More than one production data supplied for well `000000000000000000000000` in `2000-01-01`',
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		collision = [toISingleDailyProduction(getDailyProds()[0])];
		req.body = [...getDailyProdsJson()];
		await postDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					ProductionCollisionError.name,
					'Production data for well `000000000000000000000000` in `2000-01-01` already exist',
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		const wellId = Types.ObjectId();
		getId = () => wellId;
		const prod1 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod1AsApiWell = { ...prod1, date: new Date('2000-01-01'), well: wellId };
		req.body = [prod1, { dataSource: 'di', chosenID: '22222222222222', date: '2000-01-01', oil: 42 }];
		await postDailyProduction(req, res);
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
		await postDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with data source `di` and chosen id `22222222222222` in company scope',
					'[0]',
					'22222222222222',
				),
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with id `123456789012345678901234` in company scope',
					'[1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	test('postDailyProduction runs correctly', async () => {
		const { req, res } = mockExpress();

		const wellId: Types.ObjectId | undefined = Types.ObjectId();

		const create = jest.fn((prod: Array<ISingleDailyProduction | undefined>) => ({
			results: prod.map((p) => p && getCreatedStatus(toApiDailyProduction(p))),
		}));
		res.locals = {
			service: {
				create,
				findMatches: () => [],
				getWellsIds: (prods: Array<ApiDailyProduction | undefined>) =>
					prods.map((p) => (!p || p.well ? p : { ...p, well: wellId })),
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = getDailyProdsJson()[0];
		await postDailyProduction(req, res);
		expect(create).toHaveBeenLastCalledWith([toISingleDailyProduction(getDailyProds()[0])]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(getDailyProds()[0])],
			successCount: 1,
			failedCount: 0,
		});

		req.body = { ...getDailyProdsJson()[0], gas: null };
		await postDailyProduction(req, res);
		expect(create).toHaveBeenLastCalledWith([toISingleDailyProduction(getDailyProds()[0])]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(getDailyProds()[0])],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getDailyProdsJson(10);
		await postDailyProduction(req, res);
		expect(create).toHaveBeenLastCalledWith(getDailyProds(10).map(toISingleDailyProduction));
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getDailyProds(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});

		const prod1 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod1AsApiWell = { ...prod1, date: new Date('2000-01-01'), well: wellId };
		req.body = [prod1];
		await postDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(prod1AsApiWell)],
			successCount: 1,
			failedCount: 0,
		});

		const prod21 = { well: '123456789012345678901234', date: '2000-01-01', oil: 42 };
		const prod22 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod21AsApiWell = { ...prod21, date: new Date('2000-01-01'), well: Types.ObjectId(prod21.well) };
		const prod22AsApiWell = { ...prod22, date: new Date('2000-01-01'), well: wellId };
		req.body = [prod21, prod22];
		await postDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(prod21AsApiWell), getCreatedStatus(prod22AsApiWell)],
			successCount: 2,
			failedCount: 0,
		});
	});

	test('putDailyProduction causes validation error', async () => {
		const { req, res } = mockExpress();

		let getId = ({ well }: ApiDailyProduction): Types.ObjectId | undefined => well || Types.ObjectId();

		res.locals = {
			service: {
				upsert: (prod: Array<ISingleDailyProduction | undefined>) => ({
					results: prod.map((p) => p && getOkStatus(toApiDailyProduction(p))),
				}),
				getWellsIds: (prods: Array<ApiDailyProduction | undefined>) =>
					prods.map((p) => p && { ...p, well: getId(p) }),
			},
		};
		res.status = jest.fn(() => res);
		res.status = jest.fn(() => res);
		res.status = jest.fn(() => res);
		res.status = jest.fn(() => res);
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid production data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putDailyProduction(req, res)).rejects.toThrow(RecordCountError);

		req.body = { well: '123456789012345678901234', date: '2000-01-01', a: 'b' };
		await putDailyProduction(req, res);
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
		await putDailyProduction(req, res);
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
		await putDailyProduction(req, res);
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
		await putDailyProduction(req, res);
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
		await putDailyProduction(req, res);
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
		await putDailyProduction(req, res);
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
		await putDailyProduction(req, res);
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
		await putDailyProduction(req, res);
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
		await putDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(TypeError.name, '`fourty two` is not a valid number', '[0].oil')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...getDailyProdsJson(), ...getDailyProdsJson()];
		await putDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateProductionError.name,
					'More than one production data supplied for well `000000000000000000000000` in `2000-01-01`',
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateProductionError.name,
					'More than one production data supplied for well `000000000000000000000000` in `2000-01-01`',
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		const wellId = Types.ObjectId();
		getId = () => wellId;
		const prod1 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod1AsApiWell = { ...prod1, date: new Date('2000-01-01'), well: wellId };
		req.body = [prod1, { dataSource: 'di', chosenID: '22222222222222', date: '2000-01-01', oil: 42 }];
		await putDailyProduction(req, res);
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
		await putDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with data source `di` and chosen id `22222222222222` in company scope',
					'[0]',
					'22222222222222',
				),
				getErrorStatus(
					WellNotFoundError.name,
					'No well was found with id `123456789012345678901234` in company scope',
					'[1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	test('putDailyProduction runs correctly', async () => {
		const { req, res } = mockExpress();

		const wellId: Types.ObjectId | undefined = Types.ObjectId();

		const upsert = jest.fn((prod: Array<ISingleDailyProduction | undefined>) => ({
			results: prod.map((p) => p && getOkStatus(toApiDailyProduction(p))),
		}));
		res.locals = {
			service: {
				upsert,
				findMatches: () => [],
				getWellsIds: (prods: Array<ApiDailyProduction | undefined>) =>
					prods.map((p) => (!p || p.well ? p : { ...p, well: wellId })),
			},
		};
		res.status = jest.fn(() => res);
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = getDailyProdsJson()[0];
		await putDailyProduction(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toISingleDailyProduction(getDailyProds()[0])]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(getDailyProds()[0])],
			successCount: 1,
			failedCount: 0,
		});

		req.body = { ...getDailyProdsJson()[0], gas: null };
		await putDailyProduction(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toISingleDailyProduction(getDailyProds()[0])]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(getDailyProds()[0])],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getDailyProdsJson(10);
		await putDailyProduction(req, res);
		expect(upsert).toHaveBeenLastCalledWith(getDailyProds(10).map(toISingleDailyProduction));
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getDailyProds(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});

		const prod1 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod1AsApiWell = { ...prod1, date: new Date('2000-01-01'), well: wellId };
		req.body = [prod1];
		await putDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(prod1AsApiWell)],
			successCount: 1,
			failedCount: 0,
		});

		const prod21 = { well: '123456789012345678901234', date: '2000-01-01', oil: 42 };
		const prod22 = { dataSource: 'internal' as const, chosenID: '11111111111111', date: '2000-01-01', oil: 42 };
		const prod21AsApiWell = { ...prod21, date: new Date('2000-01-01'), well: Types.ObjectId(prod21.well) };
		const prod22AsApiWell = { ...prod22, date: new Date('2000-01-01'), well: wellId };
		req.body = [prod21, prod22];
		await putDailyProduction(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(prod21AsApiWell), getOkStatus(prod22AsApiWell)],
			successCount: 2,
			failedCount: 0,
		});
	});

	test('deleteDailyProduction runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'daily-productions';

		let result = 0;
		const serviceDailyProduction = jest.fn(() => result);

		res.locals = {
			service: {
				deleteDailyProduction: serviceDailyProduction,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await deleteDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		result = 5;
		await deleteDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '5',
		});
		expect(res.json).not.toHaveBeenCalled();

		result = 25;
		await deleteDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '25',
		});
		expect(res.json).not.toHaveBeenCalled();

		req.query = { well: '123456789012345678901234' };
		result = 5;
		await deleteDailyProduction(req, res);
		expect(serviceDailyProduction).toHaveBeenLastCalledWith({ well: ['123456789012345678901234'] });
		expect(res.set).toHaveBeenLastCalledWith({
			'X-Delete-Count': '5',
		});

		const serviceCallTimes = serviceDailyProduction.mock.calls.length;
		req.query = { well: '123456789012345678901234', a: 'b' };
		result = 6;
		await expect(deleteDailyProduction(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceDailyProduction.mock.calls.length).toBe(serviceCallTimes);
	});
});
