import { Types } from 'mongoose';

import { FieldNameFilterError, RecordCountError, TypeError, ValidationError } from '@src/helpers/validation';
import { generateObjectId, generateString } from '@src/helpers/test/data-generation';
import { CursorType } from '@src/api/v1/pagination';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { getDeleteHeaders } from '../../delete';

import { ApiScenario, READ_RECORD_LIMIT } from './fields';
import {
	deleteScenarios,
	getScenarioById,
	getScenarios,
	getScenariosHead,
	SCENARIO_WRL,
	upsertScenario,
} from './controllers';
import { ScenarioNotFoundError } from './validation';

import { mockExpress } from '@test/express-mocks';

const getScenariosArray = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		id: generateObjectId(i),
		name: generateString(i),
	}));

describe('v1/projects/:projectId/scenarios/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getScenariosHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/scenarios';

		res.locals = {
			service: {
				getScenariosCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getScenariosHead, READ_RECORD_LIMIT);
	});
	test('getScenariosHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/scenarios`;

		req.originalUrl = originalUrl;

		let count = 0;

		const getScenariosCount = jest.fn(() => count);

		res.locals = {
			service: {
				getScenariosCount,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getScenariosHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getScenariosHead(req, res);
		expect(getScenariosCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getScenariosHead(req, res);
		expect(getScenariosCount).toHaveBeenLastCalledWith({}, project);
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
		await getScenariosHead(req, res);
		expect(getScenariosCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getScenariosHead(req, res);
		expect(getScenariosCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getScenariosCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'default1', a: 'b' };
		count = 35;
		await expect(getScenariosHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getScenariosCount.mock.calls.length).toBe(serviceCallTimes);
	});
	test('getScenarios throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/scenarios`;

		res.locals = {
			service: {
				getScenarios: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getScenarios, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getScenarios(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getScenarios(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getScenarios(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getScenarios(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getScenarios(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getScenarios(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getScenarios(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getScenarios(req, res)).rejects.toThrow(ValidationError);
	});

	test('getScenarios runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/scenarios`;

		req.originalUrl = originalUrl;

		let result: ApiScenario[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceScenario = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getScenarios: serviceScenario,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getScenariosArray(3);
		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getScenariosArray(3));

		result = getScenariosArray(25);
		hasNext = true;
		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getScenariosArray(25));

		req.query = { skip: '25' };
		result = getScenariosArray(25);
		hasNext = true;
		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getScenariosArray(25));

		req.query = { skip: '30', take: '10' };
		result = getScenariosArray(5);
		hasNext = false;
		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getScenariosArray(5);
		hasNext = false;
		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(
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

		const serviceCallTimes = serviceScenario.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'default1', a: 'b' };
		result = getScenariosArray(5);
		hasNext = false;
		await expect(getScenarios(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceScenario.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', name: 'default1', sort: '-name' };
		result = getScenariosArray(5);
		hasNext = false;
		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(
			30,
			10,
			{ name: -1 },
			{ name: ['default1'] },
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
		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getScenariosArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getScenariosArray(15);
		hasNext = true;
		cursor = null;
		await getScenarios(req, res);
		expect(serviceScenario).toHaveBeenLastCalledWith(
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
	test('getScenarioById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getScenarioById(req, res)).rejects.toThrow(ScenarioNotFoundError);
	});

	describe('upsertScenario method', () => {
		it('when body it`s bigger than write limit should throw an RecordCountError', async () => {
			const { req, res } = mockExpress();

			req.body = getScenariosArray(SCENARIO_WRL + 1);

			await expect(upsertScenario(req, res)).rejects.toThrow(RecordCountError);
		});

		it('when body not a object should throw a RequestStructureError', async () => {
			const { req, res } = mockExpress();

			req.body = 1;

			res.json = jest.fn();
			res.locals = {
				service: {
					getNames: jest.fn(),
				},
				project: { _id: Types.ObjectId() },
			};

			await upsertScenario(req, res);

			expect(res.json).toHaveBeenCalledWith({
				failedCount: 1,
				successCount: 0,
				generalErrors: [],
				results: [
					{
						code: 400,
						errors: [
							{
								location: '[0]',
								message: `Invalid Scenario model data structure`,
								name: 'RequestStructureError',
							},
						],
						status: 'Error',
					},
				],
			});
		});

		it('when name alredy exists on project should return a 207 with error item', async () => {
			const { req, res } = mockExpress();

			req.body = { name: 'name1' };

			res.json = jest.fn();
			res.locals = {
				service: {
					getNames: jest.fn().mockResolvedValue(['name1']),
				},
				project: { _id: Types.ObjectId() },
			};

			await upsertScenario(req, res);

			expect(res.json).toHaveBeenCalledWith({
				failedCount: 1,
				successCount: 0,
				generalErrors: [],
				results: [
					{
						code: 400,
						errors: [
							{
								location: '[0]',
								message: `A scenario with the name 'name1' already exists in this project`,
								name: 'RequestStructureError',
							},
						],
						status: 'Error',
					},
				],
			});
		});

		it('when everything is fine should return a 207 with created item', async () => {
			const { req, res } = mockExpress();

			req.body = { name: 'name1' };

			const expectedResult = {
				failedCount: 0,
				successCount: 1,
				results: [
					{
						code: 201,
						status: 'Created',
						ChosenID: '5e272bed4b97ed00132f2271',
					},
				],
			};

			res.json = jest.fn();
			res.locals = {
				service: {
					getNames: jest.fn().mockResolvedValue(['name2']),
					upsertScenarios: jest.fn().mockResolvedValue(expectedResult),
				},
				project: { _id: Types.ObjectId() },
			};

			await upsertScenario(req, res);

			expect(res.json).toHaveBeenCalledWith(expectedResult);
		});
	});

	describe('deleteScenarios method', () => {
		it('should call the delete scenarios and return to deleteCount on headers', async () => {
			const { req, res } = mockExpress();

			req.query = { name: ['name1', 'name2'], id: '5e272bed4b97ed00132f2271' };

			const project = { _id: Types.ObjectId() };
			const service = {
				deleteScenarios: jest.fn().mockResolvedValue(20),
			};

			res.end = jest.fn();
			res.set = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);
			res.locals = { service, project };

			await deleteScenarios(req, res);

			expect(service.deleteScenarios).toHaveBeenCalledWith(project._id, {
				name: ['name1', 'name2'],
				id: ['5e272bed4b97ed00132f2271'],
			});

			expect(res.set).toHaveBeenCalledWith(getDeleteHeaders(20));
			expect(res.status).toHaveBeenCalledWith(204);
		});
	});
});
