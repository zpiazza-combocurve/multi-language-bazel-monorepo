import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { DataSource, IOwnershipQualifier } from '@src/models/econ/ownership-qualifiers';
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
import { generateObjectId, generateString } from '@src/helpers/test/data-generation';
import { CursorType } from '@src/api/v1/pagination';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { IValidationErrorEntry } from '../multi-error';

import {
	ApiOwnershipQualifier,
	READ_RECORD_LIMIT,
	toApiOwnershipQualifier,
	toOwnershipQualifier,
	WRITE_RECORD_LIMIT,
} from './fields/ownership-qualifier';
import {
	DuplicateOwnershipQualifierError,
	OwnershipQualifierCollisionError,
	OwnershipQualifierNotFoundError,
} from './validations/ownership-qualifier';
import {
	getOwnershipQualifierHead,
	getOwnershipQualifiers,
	postOwnershipQualifiers,
	putOwnershipQualifier,
} from './controllers';
import { ApiOwnership } from './fields/ownership';
import { ApiReversion } from './fields/reversion';

import { mockExpress } from '@test/express-mocks';

const { MULTI_STATUS, CREATED, OK } = StatusCodes;

interface TypeId {
	well: Types.ObjectId;
	chosenID: string;
}

const getBaseReversion = (i = 1): ApiReversion => ({
	reversionType: 'Irr',
	reversionValue: i,
	balance: 'net',
	includeNetProfitInterest: 'yes',
	workingInterest: i,
	netProfitInterest: i,
	netRevenueInterest: i,
	leaseNetRevenueInterest: i,
	oilNetRevenueInterest: i,
	gasNetRevenueInterest: i,
	nglNetRevenueInterest: i,
	dripCondensateNetRevenueInterest: i,
});

const getOwnership = (i = 1): ApiOwnership => ({
	name: generateString(i),
	initialOwnership: {
		workingInterest: i,
		netProfitInterestType: 'expense',
		netProfitInterest: i,
		netRevenueInterest: i,
		leaseNetRevenueInterest: i,
		oilNetRevenueInterest: i,
		gasNetRevenueInterest: i,
		nglNetRevenueInterest: i,
		dripCondensateNetRevenueInterest: i,
	},
	firstReversion: getBaseReversion(i),
	secondReversion: getBaseReversion(i),
	thirdReversion: getBaseReversion(i),
	fourthReversion: getBaseReversion(i),
	fifthReversion: getBaseReversion(i),
	sixthReversion: getBaseReversion(i),
	seventhReversion: getBaseReversion(i),
	eighthReversion: getBaseReversion(i),
	ninthReversion: getBaseReversion(i),
	tenthReversion: getBaseReversion(i),
});

const generateOwnershipQualifiers = (n = 1, dataSource: DataSource = 'internal'): ApiOwnershipQualifier[] =>
	[...Array(n).keys()].map((i) => ({
		well: generateObjectId(i),
		chosenID: (i + '').padStart(14, '0'),
		dataSource,
		qualifierKey: generateString(i),
		ownership: getOwnership(n),
	}));

const getOwnershipQualifiersJson = (n = 1) =>
	generateOwnershipQualifiers(n).map(({ well, ...rest }) => ({
		well: well?.toString(),
		...rest,
	}));

const getErrorStatus = (name: string, message: string, location: string) => ({
	status: 'Error',
	code: 400,
	errors: [
		{
			name,
			message,
			location,
		},
	],
});

const getMultiErrorStatus = (errors: IValidationErrorEntry[]) => ({
	status: 'Error',
	code: 400,
	errors,
});

const getCreatedStatus = ({ well, qualifierKey }: ApiOwnershipQualifier) => ({
	status: 'Created',
	code: CREATED,
	well: well?.toString(),
	qualifierKey,
});

const getOkStatus = ({ well, qualifierKey }: ApiOwnershipQualifier) => ({
	status: 'OK',
	code: OK,
	well: well?.toString(),
	qualifierKey,
});

describe('v1/ownership-qualifiers/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getOwnershipQualifierHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'ownership-qualifiers';

		res.locals = {
			service: {
				getOwnershipQualifierCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getOwnershipQualifierHead, READ_RECORD_LIMIT);
	});

	test('getOwnershipQualifierHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const originalUrl = 'ownership-qualifiers';
		req.originalUrl = originalUrl;

		let count = 0;
		const getOwnershipQualifierCount = jest.fn(() => count);

		res.locals = {
			service: {
				getOwnershipQualifierCount,
			},
		};
		res.set = jest.fn(() => res);

		await getOwnershipQualifierHead(req, res);
		expect(getOwnershipQualifierCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 301;
		await getOwnershipQualifierHead(req, res);
		expect(getOwnershipQualifierCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=100&take=100>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=300&take=100>;rel="last"`,
			'X-Query-Count': '301',
		});

		req.query = { skip: '100' };
		count = 301;
		await getOwnershipQualifierHead(req, res);
		expect(getOwnershipQualifierCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=200&take=100>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=300&take=100>;rel="last"`,
			'X-Query-Count': '301',
		});

		req.query = { skip: '30', take: '10' };
		count = 35;
		await getOwnershipQualifierHead(req, res);
		expect(getOwnershipQualifierCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', well: '123456789012345678901234' };
		count = 35;
		await getOwnershipQualifierHead(req, res);
		expect(getOwnershipQualifierCount).toHaveBeenLastCalledWith({ well: ['123456789012345678901234'] });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getOwnershipQualifierCount.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '123456789012345678901234', a: 'b' };
		count = 35;
		await expect(getOwnershipQualifierHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getOwnershipQualifierCount.mock.calls.length).toBe(serviceCallTimes);
	});

	test('getOwnershipQualifiers throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'ownership-qualifiers';

		res.locals = {
			service: {
				getOwnershipQualifiers: () => ({ result: [], hasNext: false }),
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getOwnershipQualifiers, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['qualifierKey'] };
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=qualifierKey' };
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>qualifierKey' };
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+qualifierKey' };
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(ValidationError);
	});

	test('getOwnershipQualifiers runs correctly', async () => {
		const { req, res } = mockExpress();

		const originalUrl = 'ownership-qualifiers';
		req.originalUrl = originalUrl;

		let result: ApiOwnershipQualifier[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceOwnershipQualifier = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getOwnershipQualifiers: serviceOwnershipQualifier,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(0, 100, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = generateOwnershipQualifiers(3);
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(0, 100, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(generateOwnershipQualifiers(3));

		result = generateOwnershipQualifiers(25);
		hasNext = true;
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(0, 100, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=100&take=100>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(generateOwnershipQualifiers(25));

		req.query = { skip: '100' };
		result = generateOwnershipQualifiers(25);
		hasNext = true;
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(100, 100, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=200&take=100>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(generateOwnershipQualifiers(25));

		req.query = { skip: '30', take: '10' };
		result = generateOwnershipQualifiers(5);
		hasNext = false;
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', well: '123456789012345678901234' };
		result = generateOwnershipQualifiers(5);
		hasNext = false;
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(
			30,
			10,
			{ id: -1 },
			{ well: ['123456789012345678901234'] },
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		let serviceCallTimes = serviceOwnershipQualifier.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '123456789012345678901234', a: 'b' };
		result = generateOwnershipQualifiers(5);
		hasNext = false;
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceOwnershipQualifier.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', well: '123456789012345678901234', sort: '-well' };
		result = generateOwnershipQualifiers(5);
		hasNext = false;
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(
			30,
			10,
			{ well: -1 },
			{ well: ['123456789012345678901234'] },
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		serviceCallTimes = serviceOwnershipQualifier.mock.calls.length;
		req.query = { skip: '30', take: '10', well: '123456789012345678901234', a: 'b', sort: 'qualifierKey' };
		result = generateOwnershipQualifiers(5);
		hasNext = false;
		await expect(getOwnershipQualifiers(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceOwnershipQualifier.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', well: '123456789012345678901234', sort: '+qualifierKey' };
		result = generateOwnershipQualifiers(5);
		hasNext = false;
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(
			30,
			10,
			{ qualifierKey: 1 },
			{ well: ['123456789012345678901234'] },
			undefined,
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
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = generateOwnershipQualifiers(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', well: '5e272d7ab78910dd2a1dfdc3', sort: '+well' };
		result = generateOwnershipQualifiers(15);
		hasNext = true;
		cursor = null;
		await getOwnershipQualifiers(req, res);
		expect(serviceOwnershipQualifier).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: 1 },
			{ well: ['5e272d7ab78910dd2a1dfdc3'] },
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});

	test('postOwnershipQualifiers causes validation error', async () => {
		const { req, res } = mockExpress();

		let collision: IOwnershipQualifier[] = [];
		let getId = ({ well, chosenID }: ApiOwnershipQualifier): TypeId | undefined => ({
			well: well || Types.ObjectId(),
			chosenID: chosenID || '',
		});

		res.locals = {
			service: {
				create: (prod: Array<IOwnershipQualifier | undefined>) => ({
					results: prod.map((p) => p && getCreatedStatus(toApiOwnershipQualifier(p))),
				}),
				findMatches: () => collision,
				getWellsIds: (ownershipQualifiers: Array<IOwnershipQualifier | undefined>) =>
					ownershipQualifiers.map(
						(o) => o && { ...o, ...(getId(o) ?? { well: undefined, chosenID: undefined }) },
					),
				getCountByWell: () => ({}),
				getExistingQualifierKeys: () => [],
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership qualifier data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership qualifier data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership qualifier data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postOwnershipQualifiers(req, res)).rejects.toThrow(RecordCountError);

		req.body = { well: '123456789012345678901234', a: 'b' };
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `qualifierKey`',
						location: '[0]',
					},
					{ name: RequiredFieldError.name, message: 'Missing required field: `ownership`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `qualifierKey`',
						location: '[0]',
					},
					{ name: RequiredFieldError.name, message: 'Missing required field: `ownership`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `dataSource`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { well: '123456789012345678901234', qualifierKey: '' };
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `ownership`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { dataSource: 'internal', chosenID: '', qualifierKey: '', ownership: {} };
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `initialOwnership`',
						location: '[0].ownership',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...getOwnershipQualifiersJson(), ...getOwnershipQualifiersJson()];
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateOwnershipQualifierError.name,
					'More than one ownership qualifier data supplied for well `000000000000000000000000` and qualifier key `y`',
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateOwnershipQualifierError.name,
					'More than one ownership qualifier data supplied for well `000000000000000000000000` and qualifier key `y`',
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		collision = [toOwnershipQualifier(generateOwnershipQualifiers()[0])];
		req.body = [...getOwnershipQualifiersJson()];
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					OwnershipQualifierCollisionError.name,
					'Ownership qualifier well `000000000000000000000000` and qualifier key `y` already exist',
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});

		const wellId = Types.ObjectId();
		const data1 = { ...getOwnershipQualifiersJson()[0], well: wellId.toString(), dataSource: 'internal' };
		const data1Api = { ...generateOwnershipQualifiers()[0], well: wellId };
		const data2 = { ...getOwnershipQualifiersJson()[0], dataSource: 'di' };
		req.body = [data1, data2];
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getCreatedStatus(data1Api),
				getErrorStatus(
					DifferentDataSourceError.name,
					'Different data source found: `di`. All records in a request must be from the same data source.',
					'[1]',
				),
			],
			successCount: 1,
			failedCount: 1,
		});

		getId = () => undefined;
		req.body = [
			{ ...getOwnershipQualifiersJson()[0], dataSource: 'internal', chosenID: '22222222222222', well: undefined },
			{ ...getOwnershipQualifiersJson()[0], well: '123456789012345678901234' },
		];
		await postOwnershipQualifiers(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					OwnershipQualifierNotFoundError.name,
					'No well was found with data source `internal` and chosen id `22222222222222`',
					'[0]',
				),
				getErrorStatus(
					OwnershipQualifierNotFoundError.name,
					'No well was found with id `123456789012345678901234`',
					'[1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	test('postOwnershipQualifiers runs correctly', async () => {
		const { req, res } = mockExpress();

		const wellId: Types.ObjectId | undefined = Types.ObjectId();
		const chosenID = '111111111';

		const create = jest.fn((ownershipQualifiers: Array<IOwnershipQualifier | undefined>) => ({
			results: ownershipQualifiers.map((o) => o && getCreatedStatus(toApiOwnershipQualifier(o))),
		}));
		res.locals = {
			service: {
				create,
				findMatches: () => [],
				getWellsIds: (ownershipQualifiers: Array<IOwnershipQualifier | undefined>) =>
					ownershipQualifiers.map((o) =>
						!o || (o.well && o.chosenID) ? o : { ...o, well: wellId, chosenID: chosenID },
					),
				getCountByWell: () => ({}),
				getExistingQualifierKeys: () => [],
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getOwnershipQualifiersJson()[0], dataSource: 'internal', chosenID: chosenID };
		const dataApi = {
			...generateOwnershipQualifiers()[0],
			dataSource: 'internal',
			chosenID: chosenID,
		} as ApiOwnershipQualifier;
		req.body = data;
		await postOwnershipQualifiers(req, res);
		expect(create).toHaveBeenLastCalledWith([toOwnershipQualifier(dataApi)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getOwnershipQualifiersJson(10);
		await postOwnershipQualifiers(req, res);
		expect(create).toHaveBeenLastCalledWith(generateOwnershipQualifiers(10).map(toOwnershipQualifier));
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: generateOwnershipQualifiers(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	test('putOwnershipQualifiers causes validation error', async () => {
		const { req, res } = mockExpress();

		let getId = ({ well, chosenID }: ApiOwnershipQualifier): TypeId | undefined => ({
			well: well || Types.ObjectId(),
			chosenID: chosenID || '',
		});

		res.locals = {
			service: {
				upsert: (prod: Array<IOwnershipQualifier | undefined>) => ({
					results: prod.map((p) => p && getCreatedStatus(toApiOwnershipQualifier(p))),
				}),
				findMatches: () => [],
				getWellsIds: (ownershipQualifiers: Array<IOwnershipQualifier | undefined>) =>
					ownershipQualifiers.map(
						(o) => o && { ...o, ...(getId(o) ?? { well: undefined, chosenID: undefined }) },
					),
				getCountByWell: () => ({}),
				getExistingQualifierKeys: () => [],
			},
		};

		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership qualifier data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership qualifier data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid ownership qualifier data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putOwnershipQualifier(req, res)).rejects.toThrow(RecordCountError);

		req.body = { well: '123456789012345678901234', a: 'b' };
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `qualifierKey`',
						location: '[0]',
					},
					{ name: RequiredFieldError.name, message: 'Missing required field: `ownership`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `qualifierKey`',
						location: '[0]',
					},
					{ name: RequiredFieldError.name, message: 'Missing required field: `ownership`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `chosenID`', location: '[0]' },
					{ name: RequiredFieldError.name, message: 'Missing required field: `dataSource`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { well: '123456789012345678901234', qualifierKey: '' };
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: RequiredFieldError.name, message: 'Missing required field: `ownership`', location: '[0]' },
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = { dataSource: 'internal', chosenID: '', qualifierKey: '', ownership: {} };
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `initialOwnership`',
						location: '[0].ownership',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...getOwnershipQualifiersJson(), ...getOwnershipQualifiersJson()];
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateOwnershipQualifierError.name,
					'More than one ownership qualifier data supplied for well `000000000000000000000000` and qualifier key `y`',
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateOwnershipQualifierError.name,
					'More than one ownership qualifier data supplied for well `000000000000000000000000` and qualifier key `y`',
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		const wellId = Types.ObjectId();
		const data1 = { ...getOwnershipQualifiersJson()[0], well: wellId.toString(), dataSource: 'internal' };
		const data1Api = { ...generateOwnershipQualifiers()[0], well: wellId };
		const data2 = { ...getOwnershipQualifiersJson()[0], dataSource: 'di' };
		req.body = [data1, data2];
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getCreatedStatus(data1Api),
				getErrorStatus(
					DifferentDataSourceError.name,
					'Different data source found: `di`. All records in a request must be from the same data source.',
					'[1]',
				),
			],
			successCount: 1,
			failedCount: 1,
		});

		getId = () => undefined;
		req.body = [
			{ ...getOwnershipQualifiersJson()[0], dataSource: 'internal', chosenID: '22222222222222', well: undefined },
			{ ...getOwnershipQualifiersJson()[0], well: '123456789012345678901234' },
		];
		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					OwnershipQualifierNotFoundError.name,
					'No well was found with data source `internal` and chosen id `22222222222222`',
					'[0]',
				),
				getErrorStatus(
					OwnershipQualifierNotFoundError.name,
					'No well was found with id `123456789012345678901234`',
					'[1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	test('putOwnershipQualifiers causes validation error when AsOf reversion has date value', async () => {
		const { req, res } = mockExpress();

		const getId = ({ well, chosenID }: ApiOwnershipQualifier): TypeId | undefined => ({
			well: well || Types.ObjectId(),
			chosenID: chosenID || '',
		});

		res.locals = {
			service: {
				upsert: (prod: Array<IOwnershipQualifier | undefined>) => ({
					results: prod.map((p) => p && getCreatedStatus(toApiOwnershipQualifier(p))),
				}),
				findMatches: () => [],
				getWellsIds: (ownershipQualifiers: Array<IOwnershipQualifier | undefined>) =>
					ownershipQualifiers.map(
						(o) => o && { ...o, ...(getId(o) ?? { well: undefined, chosenID: undefined }) },
					),
				getCountByWell: () => ({}),
				getExistingQualifierKeys: () => [],
			},
		};

		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const wellId = Types.ObjectId();
		const ownershipQualifier = getOwnershipQualifiersJson()[0];
		const reversionValue = new Date('2020-03-01');

		ownershipQualifier.ownership = {
			name: 'test',
			initialOwnership: {
				workingInterest: 1,
				netProfitInterestType: 'expense',
				netProfitInterest: 1,
				netRevenueInterest: 1,
				leaseNetRevenueInterest: 1,
				oilNetRevenueInterest: 1,
				gasNetRevenueInterest: 1,
				nglNetRevenueInterest: 1,
				dripCondensateNetRevenueInterest: 1,
			},
			firstReversion: {
				reversionType: 'AsOf',
				reversionValue: reversionValue,
				balance: 'net',
				includeNetProfitInterest: 'yes',
				workingInterest: 1,
				netProfitInterest: 1,
				netRevenueInterest: 1,
				leaseNetRevenueInterest: 1,
				oilNetRevenueInterest: 1,
				gasNetRevenueInterest: 1,
				nglNetRevenueInterest: 1,
				dripCondensateNetRevenueInterest: 1,
			},
		};

		const data = { ...ownershipQualifier, well: wellId.toString(), dataSource: 'internal' };
		req.body = [data];

		await putOwnershipQualifier(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					TypeError.name,
					`\`${reversionValue}\` is not a valid number`,
					'[0].ownership.firstReversion.reversionValue',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	test('putOwnershipQualifiers runs correctly', async () => {
		const { req, res } = mockExpress();

		const wellId: Types.ObjectId | undefined = Types.ObjectId();
		const chosenID = '111111111';

		const upsert = jest.fn((ownershipQualifiers: Array<IOwnershipQualifier | undefined>) => ({
			results: ownershipQualifiers.map((o) => o && getOkStatus(toApiOwnershipQualifier(o))),
		}));
		res.locals = {
			service: {
				upsert,
				findMatches: () => [],
				getWellsIds: (ownershipQualifiers: Array<IOwnershipQualifier | undefined>) =>
					ownershipQualifiers.map((o) =>
						!o || (o.well && o.chosenID) ? o : { ...o, well: wellId, chosenID: chosenID },
					),
				getCountByWell: () => ({}),
				getExistingQualifierKeys: () => [],
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getOwnershipQualifiersJson()[0], dataSource: 'internal', chosenID: chosenID };
		const dataApi = {
			...generateOwnershipQualifiers()[0],
			dataSource: 'internal',
			chosenID: chosenID,
		} as ApiOwnershipQualifier;
		req.body = data;
		await putOwnershipQualifier(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toOwnershipQualifier(dataApi)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getOwnershipQualifiersJson(10);
		await putOwnershipQualifier(req, res);
		expect(upsert).toHaveBeenLastCalledWith(generateOwnershipQualifiers(10).map(toOwnershipQualifier));
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: generateOwnershipQualifiers(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	test('putOwnershipQualifiers runs correctly when AsOf reversion has numeric value', async () => {
		const { req, res } = mockExpress();

		const wellId: Types.ObjectId | undefined = Types.ObjectId();
		const chosenID = '111111111';

		const upsert = jest.fn((ownershipQualifiers: Array<IOwnershipQualifier | undefined>) => ({
			results: ownershipQualifiers.map((o) => o && getOkStatus(toApiOwnershipQualifier(o))),
		}));
		res.locals = {
			service: {
				upsert,
				findMatches: () => [],
				getWellsIds: (ownershipQualifiers: Array<IOwnershipQualifier | undefined>) =>
					ownershipQualifiers.map((o) =>
						!o || (o.well && o.chosenID) ? o : { ...o, well: wellId, chosenID: chosenID },
					),
				getCountByWell: () => ({}),
				getExistingQualifierKeys: () => [],
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const ownershipQualifier = getOwnershipQualifiersJson()[0];

		ownershipQualifier.ownership = {
			name: 'test',
			initialOwnership: {
				workingInterest: 1,
				netProfitInterestType: 'expense',
				netProfitInterest: 1,
				netRevenueInterest: 1,
				leaseNetRevenueInterest: 1,
				oilNetRevenueInterest: 1,
				gasNetRevenueInterest: 1,
				nglNetRevenueInterest: 1,
				dripCondensateNetRevenueInterest: 1,
			},
			firstReversion: {
				reversionType: 'AsOf',
				reversionValue: 2,
				balance: 'net',
				includeNetProfitInterest: 'yes',
				workingInterest: 1,
				netProfitInterest: 1,
				netRevenueInterest: 1,
				leaseNetRevenueInterest: 1,
				oilNetRevenueInterest: 1,
				gasNetRevenueInterest: 1,
				nglNetRevenueInterest: 1,
				dripCondensateNetRevenueInterest: 1,
			},
		};

		const data = { ...ownershipQualifier, dataSource: 'internal', chosenID: chosenID, well: wellId.toString() };
		req.body = [data];

		const dataApi = {
			...ownershipQualifier,
			dataSource: 'internal',
			chosenID: chosenID,
			well: wellId,
		} as ApiOwnershipQualifier;
		req.body = data;
		await putOwnershipQualifier(req, res);
		expect(upsert).toHaveBeenLastCalledWith([toOwnershipQualifier(dataApi)]);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});
	});
});
