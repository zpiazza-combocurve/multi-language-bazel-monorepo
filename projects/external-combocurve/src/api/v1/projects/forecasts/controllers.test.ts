import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { FieldNameFilterError, RequestStructureError, TypeError, ValidationError } from '@src/helpers/validation';
import {
	generateBoolean,
	generateDate,
	generateEnum,
	generateObjectId,
	generateString,
} from '@src/helpers/test/data-generation';
import { CursorType } from '@src/api/v1/pagination';
import { FORECAST_TYPE } from '@src/models/forecasts';
import { getErrorStatus } from '@src/helpers/test/multi-status';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { IMultiStatusResponse } from '../../multi-status';

import { addWellToForecast, getForecastById, getForecasts, getForecastsHead } from './controllers';
import { ApiForecast, READ_RECORD_LIMIT } from './fields';
import { ForecastNotFoundError, WellAlreadyExistOnForecast, WellNotExistOnProject } from './validation';
import { toCreatedStatus } from './multi-status';

import { mockExpress } from '@test/express-mocks';

const { MULTI_STATUS } = StatusCodes;

const getForecastsArray = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		id: generateObjectId(i),
		name: generateString(i),
		type: generateEnum(i, FORECAST_TYPE),
		running: generateBoolean(i),
		runDate: generateDate(i + 1),
	}));

describe('v1/projects/:projectId/forecasts/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getForecastsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/forecasts';

		res.locals = {
			service: {
				getForecastsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getForecastsHead, READ_RECORD_LIMIT);
	});
	test('getForecastsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/forecasts`;

		req.originalUrl = originalUrl;

		let count = 0;

		const getForecastsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getForecastsCount,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getForecastsHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getForecastsHead(req, res);
		expect(getForecastsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getForecastsHead(req, res);
		expect(getForecastsCount).toHaveBeenLastCalledWith({}, project);
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
		await getForecastsHead(req, res);
		expect(getForecastsCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getForecastsHead(req, res);
		expect(getForecastsCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getForecastsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'default1', a: 'b' };
		count = 35;
		await expect(getForecastsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getForecastsCount.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', name: 'default1', type: 'probabilistic' };
		count = 35;
		await getForecastsHead(req, res);
		expect(getForecastsCount).toHaveBeenLastCalledWith({ name: ['default1'], type: ['probabilistic'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});
	});
	test('getForecasts throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/forecasts`;

		res.locals = {
			service: {
				getProjects: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getForecasts, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getForecasts(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['runDate'] };
		await expect(getForecasts(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getForecasts(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getForecasts(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=runDate' };
		await expect(getForecasts(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>runDate' };
		await expect(getForecasts(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+runDate' };
		await expect(getForecasts(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getForecasts(req, res)).rejects.toThrow(ValidationError);
	});

	test('getForecasts runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/forecasts`;

		req.originalUrl = originalUrl;

		let result: ApiForecast[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceForecast = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getForecasts: serviceForecast,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getForecastsArray(3);
		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getForecastsArray(3));

		result = getForecastsArray(25);
		hasNext = true;
		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getForecastsArray(25));

		req.query = { skip: '25' };
		result = getForecastsArray(25);
		hasNext = true;
		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getForecastsArray(25));

		req.query = { skip: '30', take: '10' };
		result = getForecastsArray(5);
		hasNext = false;
		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getForecastsArray(5);
		hasNext = false;
		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(
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

		let serviceCallTimes = serviceForecast.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'default1', a: 'b' };
		result = getForecastsArray(5);
		hasNext = false;
		await expect(getForecasts(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceForecast.mock.calls.length).toBe(serviceCallTimes);

		serviceCallTimes = serviceForecast.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'default1', a: 'b', sort: '-name' };
		result = getForecastsArray(5);
		hasNext = false;
		await expect(getForecasts(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceForecast.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', name: 'default1', type: 'probabilistic', sort: '-name' };
		result = getForecastsArray(5);
		hasNext = false;
		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(
			30,
			10,
			{ name: -1 },
			{ name: ['default1'], type: ['probabilistic'] },
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
		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getForecastsArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getForecastsArray(15);
		hasNext = true;
		cursor = null;
		await getForecasts(req, res);
		expect(serviceForecast).toHaveBeenLastCalledWith(
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
	test('getForecastById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getForecastById(req, res)).rejects.toThrow(ForecastNotFoundError);
	});

	test('add forecast to wells', async () => {
		const { req, res } = mockExpress();

		const multipleResponse: IMultiStatusResponse = {
			results: [],
			successCount: 0,
			failedCount: 0,
		};

		const forecastId = Types.ObjectId().toString();
		const apiForecast = { id: Types.ObjectId(), name: 'Test Forecast' } as ApiForecast;
		const multiStatusResults: IMultiStatusResponse = { results: [] };
		const testProject = { _id: Types.ObjectId(), name: 'Test Project' };
		req.params = { id: forecastId };
		req.body = {};
		res.locals = {
			service: {
				getById: () => apiForecast,
				addWellsToForecast: () => multiStatusResults,
				getForecastBaseInfo: () => ({ name: 'Test Forecast', wells: [] }),
				getProjectWellIds: () => [],
				getWellBaseInformation: () => [],
			},
			project: testProject,
		};

		res.status = jest.fn(() => res);
		res.json = jest.fn();

		await expect(addWellToForecast(req, res)).rejects.toThrow(RequestStructureError);

		req.params = { id: 'invalidForecastId' };
		req.body = { wellIds: [] };
		res.locals.service.getById = () => null;
		await expect(addWellToForecast(req, res)).rejects.toThrow(TypeError);

		req.params = { id: forecastId };
		req.body = { wellIds: [] };

		res.locals.service.getById = () => apiForecast;
		await addWellToForecast(req, res);
		await expect(res.json).toHaveBeenLastCalledWith(multipleResponse);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);

		req.body = { wellIds: ['testIncorrectId', 'testIncorrectId2'] };

		await addWellToForecast(req, res);
		multipleResponse.results = [
			getErrorStatus(TypeError.name, '`testIncorrectId` is not a valid ObjectId', '[0]'),
			getErrorStatus(TypeError.name, '`testIncorrectId2` is not a valid ObjectId', '[1]'),
		];
		multipleResponse.failedCount = 2;
		expect(res.json).toHaveBeenLastCalledWith(multipleResponse);

		const correctWellId = Types.ObjectId().toString();
		req.body = { wellIds: [correctWellId, 'testIncorrectId2'] };

		await addWellToForecast(req, res);
		multipleResponse.results = [
			getErrorStatus(
				WellNotExistOnProject.name,
				`wellId \`${correctWellId}\` was not found in project \`${res.locals.project._id}:${testProject.name}\` `,
				'[0]',
			),
			getErrorStatus(TypeError.name, '`testIncorrectId2` is not a valid ObjectId', '[1]'),
		];
		multipleResponse.failedCount = 2;
		expect(res.json).toHaveBeenLastCalledWith(multipleResponse);
		const testForecastName = 'Test Forecast';
		res.locals.service.getProjectWellIds = () => [correctWellId];
		res.locals.service.getForecastBaseInfo = () => ({
			_id: forecastId,
			name: testForecastName,
			wells: [correctWellId],
		});

		await addWellToForecast(req, res);
		multipleResponse.results = [
			getErrorStatus(
				WellAlreadyExistOnForecast.name,
				`wellId \`${correctWellId}\` was found in Forecast \`${forecastId}:${testForecastName}\` `,
				'[0]',
			),
			getErrorStatus(TypeError.name, '`testIncorrectId2` is not a valid ObjectId', '[1]'),
		];
		multipleResponse.failedCount = 2;
		expect(res.json).toHaveBeenLastCalledWith(multipleResponse);

		res.locals.service.getForecastBaseInfo = () => ({
			_id: forecastId,
			name: testForecastName,
			wells: [],
		});
		res.locals.service.addWellsToForecast = () => ({ results: [toCreatedStatus(correctWellId)] });

		await addWellToForecast(req, res);
		multipleResponse.results = [
			toCreatedStatus(correctWellId),
			getErrorStatus(TypeError.name, '`testIncorrectId2` is not a valid ObjectId', '[1]'),
		];
		multipleResponse.failedCount = 1;
		multipleResponse.successCount = 1;
		expect(res.json).toHaveBeenLastCalledWith(multipleResponse);

		const wellName = 'Tets WellName';
		const wellNotInProject = Types.ObjectId().toString();
		const wellNotInProjectName = 'Tets WellName Not In Project';
		res.locals.service.getProjectWellIds = () => [correctWellId];
		res.locals.service.getForecastBaseInfo = () => ({
			_id: forecastId,
			name: testForecastName,
			wells: [correctWellId],
		});
		res.locals.service.getWellBaseInformation = () => [
			{
				_id: correctWellId,
				well_name: wellName,
			},
			{
				_id: wellNotInProject,
				well_name: wellNotInProjectName,
			},
		];

		req.body = { wellIds: [correctWellId, wellNotInProject] };

		await addWellToForecast(req, res);
		multipleResponse.results = [
			getErrorStatus(
				WellAlreadyExistOnForecast.name,
				`well \`${correctWellId}:${wellName}\` was found in Forecast \`${forecastId}:${testForecastName}\` `,
				'[0]',
			),
			getErrorStatus(
				WellNotExistOnProject.name,
				`well \`${wellNotInProject}:${wellNotInProjectName}\` was not found in project \`${res.locals.project._id}:${testProject.name}\` `,
				'[1]',
			),
		];
		multipleResponse.failedCount = 2;
		multipleResponse.successCount = 0;
		expect(res.json).toHaveBeenLastCalledWith(multipleResponse);
	});
});
