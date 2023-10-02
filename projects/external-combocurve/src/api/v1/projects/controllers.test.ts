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
import { generateObjectId, generateString } from '@src/helpers/test/data-generation';
import { IProject } from '@src/models/projects';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { CursorType } from '../pagination';
import { IValidationErrorEntry } from '../multi-error';

import { ApiProject, READ_RECORD_LIMIT, toIProject, WRITE_RECORD_LIMIT } from './fields';
import { DuplicateProjectError, ProjectCollisionError, ProjectNotFoundError } from './validation';
import { getProjectById, getProjects, getProjectsHead, postProjects } from './controllers';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS } = StatusCodes;

const getProjectsArray = (n = 1) =>
	[...Array(n).keys()].map(
		(i) =>
			({
				id: generateObjectId(i),
				name: generateString(i),
			}) as IProject,
	);

const getCreatedStatus = ({ name }: ApiProject) => ({
	status: 'Created',
	code: CREATED,
	name,
});

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

describe('v1/projects/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getProjectsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects';

		res.locals = {
			service: {
				getProjectsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProjectsHead, READ_RECORD_LIMIT);
	});
	test('getProjectsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects';

		let count = 0;

		const getProjectsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getProjectsCount,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getProjectsHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/projects?skip=0&take=25>;rel="last"',
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getProjectsHead(req, res);
		expect(getProjectsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=25&take=25>;rel="next",' +
				'<http://www.localhost.com/projects?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/projects?skip=50&take=25>;rel="last"',
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getProjectsHead(req, res);
		expect(getProjectsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=50&take=25>;rel="next",' +
				'<http://www.localhost.com/projects?skip=0&take=25>;rel="prev",' +
				'<http://www.localhost.com/projects?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/projects?skip=50&take=25>;rel="last"',
			'X-Query-Count': '51',
		});

		req.query = { skip: '30', take: '10' };
		count = 35;
		await getProjectsHead(req, res);
		expect(getProjectsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/projects?skip=0&take=10>;rel="first",' +
				'<http://www.localhost.com/projects?skip=30&take=10>;rel="last"',
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'First' };
		count = 35;
		await getProjectsHead(req, res);
		expect(getProjectsCount).toHaveBeenLastCalledWith({ name: ['First'] });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/projects?skip=0&take=10>;rel="first",' +
				'<http://www.localhost.com/projects?skip=30&take=10>;rel="last"',
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getProjectsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'First', a: 'b' };
		count = 35;
		await expect(getProjectsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getProjectsCount.mock.calls.length).toBe(serviceCallTimes);
	});

	test('getProjects throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects';

		res.locals = {
			service: {
				getProjects: () => ({ result: [], hasNext: false }),
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getProjects, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getProjects(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['date'] };
		await expect(getProjects(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getProjects(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getProjects(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=date' };
		await expect(getProjects(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>date' };
		await expect(getProjects(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+date' };
		await expect(getProjects(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getProjects(req, res)).rejects.toThrow(ValidationError);
	});

	test('getProjects runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects';

		let result: ApiProject[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceProject = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getProjects: serviceProject,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: '<http://www.localhost.com/projects?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getProjectsArray(3);
		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: '<http://www.localhost.com/projects?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getProjectsArray(3));

		result = getProjectsArray(25);
		hasNext = true;
		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=25&take=25>;rel="next",' +
				'<http://www.localhost.com/projects?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getProjectsArray(25));

		req.query = { skip: '25' };
		result = getProjectsArray(25);
		hasNext = true;
		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=50&take=25>;rel="next",' +
				'<http://www.localhost.com/projects?skip=0&take=25>;rel="prev",' +
				'<http://www.localhost.com/projects?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getProjectsArray(25));

		req.query = { skip: '30', take: '10' };
		result = getProjectsArray(5);
		hasNext = false;
		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/projects?skip=0&take=10>;rel="first"',
		});

		req.query = { skip: '30', take: '10', name: 'First' };
		result = getProjectsArray(5);
		hasNext = false;
		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(30, 10, { id: -1 }, { name: ['First'] }, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/projects?skip=0&take=10>;rel="first"',
		});

		const serviceCallTimes = serviceProject.mock.calls.length;
		req.query = { skip: '20', take: '10', name: 'First', a: 'b' };
		result = getProjectsArray(5);
		hasNext = false;
		await expect(getProjects(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceProject.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', name: 'First', sort: '-name' };
		result = getProjectsArray(5);
		hasNext = false;
		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(30, 10, { name: -1 }, { name: ['First'] }, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/projects?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/projects?skip=0&take=10>;rel="first"',
		});

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/projects?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getProjectsArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/projects?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/projects?take=10>;rel="first"`,
		});

		req.query = { take: '10', sort: '+name' };
		result = getProjectsArray(15);
		hasNext = true;
		cursor = null;
		await getProjects(req, res);
		expect(serviceProject).toHaveBeenLastCalledWith(0, 10, { name: 1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/projects?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/projects?skip=0&take=10>;rel="first"`,
		});
	});
	test('getProjects', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects';

		res.locals = {
			service: {
				getProjects: () => ({ result: [], hasNext: false }),
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getProjects(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link: '<http://www.localhost.com/projects?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenCalledWith([]);
	});

	test('getProjectById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
		};

		res.sendStatus = jest.fn();

		await expect(getProjectById(req, res)).rejects.toThrow(ProjectNotFoundError);
	});

	test('postProjects causes validation error', async () => {
		const { req, res } = mockExpress();

		let projectNameCollisions: string[] = [];

		res.locals = {
			service: {
				create: (project: Array<IProject | undefined>) => ({
					results: project.map((p) => p && getCreatedStatus(toIProject(p))),
				}),
				getProjectNameCollisions: () => projectNameCollisions,
			},
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postProjects(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid project data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postProjects(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid project data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postProjects(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid project data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postProjects(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await postProjects(req, res);
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
		await postProjects(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `name`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [{ name: 'test1' }, { name: 'test1' }];
		await postProjects(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateProjectError.name,
					'More than one project data supplied with name `test1`',
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateProjectError.name,
					'More than one project data supplied with name `test1`',
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		projectNameCollisions = ['test1'];
		req.body = [{ name: 'test1' }];
		await postProjects(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(ProjectCollisionError.name, 'Project named `test1` already exist', '[0]')],
			successCount: 0,
			failedCount: 1,
		});
	});

	test('postProjects runs correctly', async () => {
		const { req, res } = mockExpress();

		const create = jest.fn((project: Array<IProject | undefined>) => ({
			results: project.map((p) => p && getCreatedStatus(toIProject(p))),
		}));

		res.locals = {
			service: {
				create,
				getProjectNameCollisions: () => [],
			},
		};

		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const dataApi = { name: 'test' };
		req.body = { name: 'test' };
		await postProjects(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		const projects = [...Array(10).keys()].map((_, index) => ({
			name: 'test' + index,
		}));
		req.body = projects;
		await postProjects(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: projects.map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
