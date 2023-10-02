import { Types } from 'mongoose';

import { generateObjectId, generateStrDateOnly, generateString } from '@src/helpers/test/data-generation';
import { FieldNameFilterError } from '@src/helpers/validation';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiMonthlyExport, READ_RECORD_LIMIT } from './fields';
import { createMonthlyExport, getEconMonthlyHead, getMonthlyExportById } from './controllers';

import { mockExpress } from '@test/express-mocks';

const getEconMonthlyExportArray = (n = 1) => ({
	results: [...Array(n).keys()].map((i) => ({
		comboName: generateString(i),
		date: generateStrDateOnly(i + 1),
		output: {
			adValoremTax: i,
			gasStartUsingForecastDate: generateStrDateOnly(i + 1),
			grossBoeSalesVolume: i,
		},
		well: generateObjectId(i).toString(),
	})),
	status: 'completed' as const,
});

describe('v1/projects/:projectId/scenarios/:scenarioId/econ-runs/:econRunId/monthly-exports/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getEconMonthlyHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl =
			'projects/5e272bed4b97ed00132f2271/scenarios/5e27305e4f59a9ec64eb576a/econ-runs/5f80f287d7e63537b90aa121/monthly-exports';

		res.locals = {
			service: {
				getEconMonthlyCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getEconMonthlyHead, READ_RECORD_LIMIT);
	});
	test('getEconMonthlyHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		const econRun = {
			id: Types.ObjectId('5f80f287d7e63537b90aa121'),
			runDate: new Date('2020-10-09T23:30:15.562Z'),
		};

		const originalUrl = `projects/${project._id}/scenarios/${scenarioId}/econ-runs/${econRun.id}/monthly-exports`;

		req.originalUrl = originalUrl;

		let count = 0;

		const getEconMonthlyCount = jest.fn(() => count);

		res.locals = {
			service: {
				getEconMonthlyCount,
			},
			project,
			scenarioId,
			econRun,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getEconMonthlyHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 201;
		await getEconMonthlyHead(req, res);
		expect(getEconMonthlyCount).toHaveBeenLastCalledWith({}, project, scenarioId, econRun);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=100&take=100>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=200&take=100>;rel="last"`,
			'X-Query-Count': '201',
		});

		req.query = { skip: '100' };
		count = 201;
		await getEconMonthlyHead(req, res);
		expect(getEconMonthlyCount).toHaveBeenLastCalledWith({}, project, scenarioId, econRun);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=200&take=100>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=200&take=100>;rel="last"`,
			'X-Query-Count': '201',
		});

		req.query = { skip: '30', take: '10' };
		count = 35;
		await getEconMonthlyHead(req, res);
		expect(getEconMonthlyCount).toHaveBeenLastCalledWith({}, project, scenarioId, econRun);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getEconMonthlyCount.mock.calls.length;
		req.query = { skip: '30', take: '10', a: 'b' };
		count = 35;
		await expect(getEconMonthlyHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getEconMonthlyCount.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', comboName: 'Default' };
		count = 35;
		await getEconMonthlyHead(req, res);
		expect(getEconMonthlyCount).toHaveBeenLastCalledWith({ comboName: ['Default'] }, project, scenarioId, econRun);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});
	});
	// eslint-disable-next-line jest/expect-expect
	test('getMonthlyExportById throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		const econRun = {
			id: Types.ObjectId('5f80f287d7e63537b90aa121'),
			runDate: new Date('2020-10-09T23:30:15.562Z'),
		};
		const exportId = 'b146fd90-6c26-4b3d-aaca-edca322deca1';

		req.originalUrl = `projects/${project._id}/scenarios/${scenarioId}/econ-runs/${econRun.id}/monthly-exports/${exportId}`;

		req.params = { id: exportId };

		res.locals = {
			service: {
				getMonthlyExportById: () => ({ result: {}, hasNext: false }),
			},
			project,
			scenarioId,
			econRun,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getMonthlyExportById, READ_RECORD_LIMIT);
	});

	test('getMonthlyExportById runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		const econRun = {
			id: Types.ObjectId('5f80f287d7e63537b90aa121'),
			runDate: new Date('2020-10-09T23:30:15.562Z'),
		};
		const exportId = 'b146fd90-6c26-4b3d-aaca-edca322deca1';

		const originalUrl = `projects/${project._id}/scenarios/${scenarioId}/econ-runs/${econRun.id}/monthly-exports/${exportId}`;

		req.params = { id: exportId };

		req.originalUrl = originalUrl;

		let result: ApiMonthlyExport = {};
		let hasNext = false;
		const serviceEconMonthlyExport = jest.fn(() => ({ result, hasNext }));

		res.locals = {
			service: {
				getMonthlyExportById: serviceEconMonthlyExport,
			},
			project,
			scenarioId,
			econRun,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getMonthlyExportById(req, res);
		expect(serviceEconMonthlyExport).toHaveBeenLastCalledWith(exportId, 0, 100, project, scenarioId, econRun, 0);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith({});

		result = getEconMonthlyExportArray(3);
		await getMonthlyExportById(req, res);
		expect(serviceEconMonthlyExport).toHaveBeenLastCalledWith(exportId, 0, 100, project, scenarioId, econRun, 0);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEconMonthlyExportArray(3));

		result = getEconMonthlyExportArray(100);
		hasNext = true;
		await getMonthlyExportById(req, res);
		expect(serviceEconMonthlyExport).toHaveBeenLastCalledWith(exportId, 0, 100, project, scenarioId, econRun, 0);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=100&take=100>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEconMonthlyExportArray(100));

		req.query = { skip: '25' };
		hasNext = true;
		result = getEconMonthlyExportArray(25);
		await getMonthlyExportById(req, res);
		expect(serviceEconMonthlyExport).toHaveBeenLastCalledWith(exportId, 25, 100, project, scenarioId, econRun, 0);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=125&take=100>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=100>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getEconMonthlyExportArray(25));

		req.query = { skip: '30', take: '10' };
		hasNext = false;
		result = getEconMonthlyExportArray(5);
		await getMonthlyExportById(req, res);
		expect(serviceEconMonthlyExport).toHaveBeenLastCalledWith(exportId, 30, 10, project, scenarioId, econRun, 0);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', a: 'b' };
		hasNext = false;
		result = getEconMonthlyExportArray(5);
		await getMonthlyExportById(req, res);
		expect(serviceEconMonthlyExport).toHaveBeenLastCalledWith(exportId, 30, 10, project, scenarioId, econRun, 0);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', concurrency: '6' };
		hasNext = false;
		result = getEconMonthlyExportArray(5);
		await getMonthlyExportById(req, res);
		expect(serviceEconMonthlyExport).toHaveBeenLastCalledWith(exportId, 30, 10, project, scenarioId, econRun, 6);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});
	test('createMonthlyExport runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		const econRun = {
			id: Types.ObjectId('5f80f287d7e63537b90aa121'),
			runDate: new Date('2020-10-09T23:30:15.562Z'),
		};
		const exportId = 'b146fd90-6c26-4b3d-aaca-edca322deca1';

		const originalUrl = `projects/${project._id}/scenarios/${scenarioId}/econ-runs/${econRun.id}/monthly-exports`;

		req.originalUrl = originalUrl;

		const serviceEconMonthlyExport = jest.fn(() => ({ id: exportId }));

		res.locals = {
			service: {
				createMonthlyExport: serviceEconMonthlyExport,
			},
			project,
			scenarioId,
			econRun,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		req.query = { comboName: 'Default' };
		await createMonthlyExport(req, res);
		expect(serviceEconMonthlyExport).toHaveBeenLastCalledWith(
			{ comboName: ['Default'] },
			project,
			scenarioId,
			econRun,
		);
		expect(res.json).toHaveBeenLastCalledWith({
			id: exportId,
		});

		const serviceCallTimes = serviceEconMonthlyExport.mock.calls.length;
		req.query = { comboName: 'Default', notExonMonthlyField: 'test' };
		await expect(createMonthlyExport(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceEconMonthlyExport.mock.calls.length).toBe(serviceCallTimes);

		req.query = { comboName: 'Default', date: '2020-10-12' };
		await createMonthlyExport(req, res);
		expect(serviceEconMonthlyExport).toHaveBeenLastCalledWith(
			{ comboName: ['Default'], date: ['2020-10-12'] },
			project,
			scenarioId,
			econRun,
		);
		expect(res.json).toHaveBeenLastCalledWith({
			id: exportId,
		});
	});
});
