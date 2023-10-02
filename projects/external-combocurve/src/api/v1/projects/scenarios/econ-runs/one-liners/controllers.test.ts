import { Types } from 'mongoose';

import { FieldNameFilterError, TypeError, ValidationError } from '@src/helpers/validation';
import { generateObjectId, generateString } from '@src/helpers/test/data-generation';
import { CursorType } from '@src/api/v1/pagination';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiEconRunData, READ_RECORD_LIMIT } from './fields';
import { getEconRunData, getEconRunDataById, getEconRunDataHead, getEconRunsComboNames } from './controllers';
import { EconOneLinerNotFoundError } from './validation';

import { mockExpress } from '@test/express-mocks';

const getEconRunDataArray = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		id: generateObjectId(i),
		comboName: generateString(i),
		output: {
			abandonmentDate: generateString(i),
			discountTableCashFlow_1: i,
			dripCondensateRevenue: i,
			oilP90FirstSegmentSegmentType: generateString(i),
		},
		well: generateObjectId(i),
	}));

describe('v1/projects/:projectId/scenarios/:scenarioId/econ-runs/:econRunId/one-liners/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getEconRunDataHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl =
			'projects/5e272bed4b97ed00132f2271/scenarios/5e27305e4f59a9ec64eb576a/econ-runs/5f80f287d7e63537b90aa121/one-liners';

		res.locals = {
			service: {
				getEconRunDataCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getEconRunDataHead, READ_RECORD_LIMIT);
	});
	test('getEconRunDataHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		const econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };

		const originalUrl = `projects/${project._id}/scenarios/${scenarioId}/econ-runs/${econRun.id}/one-liners`;

		req.originalUrl = originalUrl;

		let count = 0;

		const getEconRunDataCount = jest.fn(() => count);

		res.locals = {
			service: {
				getEconRunDataCount,
			},
			project,
			scenarioId,
			econRun,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getEconRunDataHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getEconRunDataHead(req, res);
		expect(getEconRunDataCount).toHaveBeenLastCalledWith({}, project, scenarioId, econRun);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getEconRunDataHead(req, res);
		expect(getEconRunDataCount).toHaveBeenLastCalledWith({}, project, scenarioId, econRun);
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
		await getEconRunDataHead(req, res);
		expect(getEconRunDataCount).toHaveBeenLastCalledWith({}, project, scenarioId, econRun);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getEconRunDataCount.mock.calls.length;
		req.query = { skip: '30', take: '10', a: 'b' };
		count = 35;
		await expect(getEconRunDataHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getEconRunDataCount.mock.calls.length).toBe(serviceCallTimes);
	});
	test('getEconRunData throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		const econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };

		req.originalUrl = `projects/${project._id}/scenarios/${scenarioId}/econ-runs/${econRun.id}/one-liners`;

		res.locals = {
			service: {
				getEconRunData: () => ({ result: [], hasNext: false }),
			},
			project,
			scenarioId,
			econRun,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getEconRunData, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getEconRunData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['comboName'] };
		await expect(getEconRunData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getEconRunData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getEconRunData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=comboName' };
		await expect(getEconRunData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>comboName' };
		await expect(getEconRunData(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+comboName' };
		await expect(getEconRunData(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getEconRunData(req, res)).rejects.toThrow(ValidationError);
	});

	test('getEconRunData runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		const econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };

		const originalUrl = `projects/${project._id}/scenarios/${scenarioId}/econ-runs/${econRun.id}/one-liners`;

		req.originalUrl = originalUrl;

		let result: ApiEconRunData[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceEconRunData = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getEconRunData: serviceEconRunData,
			},
			project,
			scenarioId,
			econRun,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			0,
			25,
			{ id: -1 },
			{},
			project,
			scenarioId,
			econRun,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getEconRunDataArray(3);
		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			0,
			25,
			{ id: -1 },
			{},
			project,
			scenarioId,
			econRun,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEconRunDataArray(3));

		result = getEconRunDataArray(25);
		hasNext = true;
		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			0,
			25,
			{ id: -1 },
			{},
			project,
			scenarioId,
			econRun,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEconRunDataArray(25));

		req.query = { skip: '25' };
		result = getEconRunDataArray(25);
		hasNext = true;
		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			25,
			25,
			{ id: -1 },
			{},
			project,
			scenarioId,
			econRun,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEconRunDataArray(25));

		req.query = { skip: '30', take: '10' };
		result = getEconRunDataArray(5);
		hasNext = false;
		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			30,
			10,
			{ id: -1 },
			{},
			project,
			scenarioId,
			econRun,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', comboName: 'default1' };
		result = getEconRunDataArray(5);
		hasNext = false;
		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			30,
			10,
			{ id: -1 },
			{ comboName: ['default1'] },
			project,
			scenarioId,
			econRun,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		const serviceCallTimes = serviceEconRunData.mock.calls.length;
		req.query = { skip: '30', take: '10', a: 'b' };
		result = getEconRunDataArray(5);
		hasNext = false;
		await expect(getEconRunData(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceEconRunData.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', sort: '-comboName' };
		result = getEconRunDataArray(5);
		hasNext = false;
		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			30,
			10,
			{ comboName: -1 },
			{},
			project,
			scenarioId,
			econRun,
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
		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			0,
			10,
			{ id: -1 },
			{},
			project,
			scenarioId,
			econRun,
			'123456789012345678901234',
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getEconRunDataArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			0,
			10,
			{ id: -1 },
			{},
			project,
			scenarioId,
			econRun,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', comboName: 'default1', sort: '+comboName' };
		result = getEconRunDataArray(15);
		hasNext = true;
		cursor = null;
		await getEconRunData(req, res);
		expect(serviceEconRunData).toHaveBeenLastCalledWith(
			0,
			10,
			{ comboName: 1 },
			{ comboName: ['default1'] },
			project,
			scenarioId,
			econRun,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});
	test('getEconRunDataById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
			scenarioId: Types.ObjectId(),
			econRun: { id: Types.ObjectId(), runDate: new Date() },
		};

		res.sendStatus = jest.fn();

		await expect(getEconRunDataById(req, res)).rejects.toThrow(EconOneLinerNotFoundError);
	});

	test('getComboNames', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getEconRunComboNames: () => null,
			},
			project: { _id: Types.ObjectId() },
			scenarioId: Types.ObjectId(),
			econRun: { id: Types.ObjectId(), runDate: new Date() },
		};

		res.sendStatus = jest.fn();

		await expect(getEconRunsComboNames(req, res)).rejects.toThrow(EconOneLinerNotFoundError);
	});
});
