import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import {
	FieldNameError,
	FieldNameFilterError,
	RecordCountError,
	RequestStructureError,
	RequiredFieldError,
	TypeError,
	ValidationError,
} from '@src/helpers/validation';
import { getErrorStatus, getMultiErrorStatus } from '@src/helpers/test/multi-status';
import { CursorType } from '@src/api/v1/pagination';
import { generateBoolean } from '@src/helpers/test/data-generation';
import { IDateSettings } from '@src/models/econ/date-settings';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiDateSettings, READ_RECORD_LIMIT, toDateSettings, WRITE_RECORD_LIMIT } from './fields/date-settings';
import { DateSettingsCollisionError, DateSettingsNotFoundError, DuplicateDateSettingsError } from './validation';
import {
	getDateSettings,
	getDateSettingsById,
	getDateSettingsHead,
	postDateSettings,
	putDateSettings,
} from './controllers';
import { ApiCutOffEconFunction } from './fields/cut-off';
import { ApiDateSettingEconFunction } from './fields/date-settings-econ-function';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;

const getDateSettingsArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
	}));

const getValidDateSettingsModel = (): {
	dateSetting: ApiDateSettingEconFunction;
	cutOff: ApiCutOffEconFunction;
} => ({
	dateSetting: {
		maxWellLife: 50,
		asOfDate: {
			fpd: true,
		},
		discountDate: {
			majorSegment: true,
		},
		cashFlowPriorAsOfDate: false,
		productionDataResolution: 'same_as_forecast',
		fpdSourceHierarchy: {
			firstFpdSource: {
				wellHeader: true,
			},
			secondFpdSource: {
				notUsed: true,
			},
			thirdFpdSource: {
				forecast: true,
			},
			fourthFpdSource: {
				notUsed: true,
			},
			useForecastSchedule: true,
		},
	},
	cutOff: {
		oilRate: 45,
		minLife: {
			none: true,
		},
		triggerEclCapex: false,
		includeCapex: false,
		econLimitDelay: 0,
		alignDependentPhases: true,
		tolerateNegativeCF: 0,
	},
});

const getDateSettingsArrayWithPayload = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
		...getValidDateSettingsModel(),
	}));

const getCreatedStatus = ({ name }: ApiDateSettings) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiDateSettings) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/date-settings/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getDateSettingsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/date-settings';

		res.locals = {
			service: {
				getDateSettingsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getDateSettingsHead, READ_RECORD_LIMIT);
	});

	it('getDateSettingsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/date-settings`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getDateSettingsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getDateSettingsCount: getDateSettingsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getDateSettingsHead(req, res);
		expect(getDateSettingsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getDateSettingsHead(req, res);
		expect(getDateSettingsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getDateSettingsHead(req, res);
		expect(getDateSettingsCount).toHaveBeenLastCalledWith({}, project);
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
		await getDateSettingsHead(req, res);
		expect(getDateSettingsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getDateSettingsHead(req, res);
		expect(getDateSettingsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getDateSettingsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getDateSettingsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getDateSettingsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getDateSettings throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/date-settings`;

		res.locals = {
			service: {
				getDateSettings: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getDateSettings, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getDateSettings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getDateSettings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getDateSettings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getDateSettings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getDateSettings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getDateSettings(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getDateSettings(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getDateSettings(req, res)).rejects.toThrow(ValidationError);
	});

	it('getDateSettings runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/date-settings`;

		req.originalUrl = originalUrl;

		let result: ApiDateSettings[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceEscalation = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getDateSettings: serviceEscalation,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getDateSettingsArray(3);
		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getDateSettingsArray(3));

		result = getDateSettingsArray(25);
		hasNext = true;
		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getDateSettingsArray(25));

		req.query = { skip: '25' };
		result = getDateSettingsArray(25);
		hasNext = true;
		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getDateSettingsArray(25));

		req.query = { skip: '30', take: '10' };
		result = getDateSettingsArray(5);
		hasNext = false;
		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getDateSettingsArray(5);
		hasNext = false;
		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(
			30,
			10,
			{ id: -1 },
			{ name: ['default1'] },
			project,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1', unique: 'false', sort: '-name' };
		result = getDateSettingsArray(5);
		hasNext = false;
		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(
			30,
			10,
			{ name: -1 },
			{ name: ['default1'], unique: ['false'] },
			project,
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
		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getDateSettingsArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getDateSettingsArray(15);
		hasNext = true;
		cursor = null;
		await getDateSettings(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(
			0,
			10,
			{ name: 1 },
			{ name: ['default1'] },
			project,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});

	it('getDateSettingsById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getDateSettingsById(req, res)).rejects.toThrow(DateSettingsNotFoundError);
	});

	it('postDateSettings causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (DateSettings: Array<IDateSettings | undefined>) => ({
					results: DateSettings.map((r) => r && getCreatedStatus(toDateSettings(r, project._id))),
				}),
				checkWells: jest.fn((DateSettings: Array<IDateSettings | undefined>) => DateSettings),
				checkScenarios: jest.fn((DateSettings: Array<IDateSettings | undefined>) => DateSettings),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const invalidDateSettingsResponse = {
			results: [getErrorStatus(RequestStructureError.name, 'Invalid DateSettings model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		};
		req.body = 1;
		await postDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith(invalidDateSettingsResponse);

		req.body = [[]];
		await postDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith(invalidDateSettingsResponse);

		req.body = [true];
		await postDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith(invalidDateSettingsResponse);

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postDateSettings(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await postDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `dateSetting`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `cutOff`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `name`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `dateSetting`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `cutOff`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getDateSettingsArrayWithPayload(1, { name, unique: false }),
			...getDateSettingsArrayWithPayload(1, { name, unique: false }),
		];
		await postDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateDateSettingsError.name,
					`More than one DateSettings model supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateDateSettingsError.name,
					`More than one DateSettings model supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getDateSettingsArrayWithPayload(1, { name, unique: false });
		names = [name];
		await postDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DateSettingsCollisionError.name,
					`DateSettings model with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postDateSettings runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((DateSettings: Array<IDateSettings | undefined>) => ({
			results: DateSettings.map((r) => r && getCreatedStatus(toDateSettings(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((DateSettings: Array<IDateSettings | undefined>) => DateSettings),
				checkScenarios: jest.fn((DateSettings: Array<IDateSettings | undefined>) => DateSettings),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getDateSettingsArrayWithPayload(1, { name, unique: false })[0] };
		const dataApi = {
			...getDateSettingsArrayWithPayload(1, { name, unique: false })[0],
		} as ApiDateSettings;
		req.body = data;
		await postDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getDateSettingsArrayWithPayload(10, { unique: false });
		await postDateSettings(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getDateSettingsArrayWithPayload(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	it('putDateSettings causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (DateSettings: Array<IDateSettings | undefined>) => ({
					results: DateSettings.map((r) => r && getOkStatus(toDateSettings(r, project._id))),
				}),
				checkWells: jest.fn((DateSettings: Array<IDateSettings | undefined>) => DateSettings),
				checkScenarios: jest.fn((DateSettings: Array<IDateSettings | undefined>) => DateSettings),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid DateSettings model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid DateSettings model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid DateSettings model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putDateSettings(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await putDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `dateSetting`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `cutOff`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `name`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `dateSetting`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `cutOff`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getDateSettingsArrayWithPayload(1, { name, unique: false }),
			...getDateSettingsArrayWithPayload(1, { name, unique: false }),
		];
		await putDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateDateSettingsError.name,
					`More than one DateSettings model supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateDateSettingsError.name,
					`More than one DateSettings model supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putDateSettings runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((DateSettings: Array<IDateSettings | undefined>) => ({
			results: DateSettings.map((r) => r && getOkStatus(toDateSettings(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((DateSettings: Array<IDateSettings | undefined>) => DateSettings),
				checkScenarios: jest.fn((DateSettings: Array<IDateSettings | undefined>) => DateSettings),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getDateSettingsArrayWithPayload(1, { unique: false })[0] };
		const dataApi = {
			...getDateSettingsArrayWithPayload(1, { unique: false })[0],
		} as ApiDateSettings;
		req.body = data;
		await putDateSettings(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getDateSettingsArrayWithPayload(10, { unique: false });
		await putDateSettings(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getDateSettingsArrayWithPayload(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
