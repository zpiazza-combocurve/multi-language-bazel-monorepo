import { Types } from 'mongoose';

import { FieldNameFilterError, TypeError, ValidationError } from '@src/helpers/validation';
import { generateEnum, generateObjectId, generateString } from '@src/helpers/test/data-generation';
import { TYPE_CURVE_FIT_ALIGN, TYPE_CURVE_FIT_TYPE } from '@src/models/type-curve';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { CursorType } from '../../pagination';

import { ApiTypeCurve, READ_RECORD_LIMIT } from './fields/type-curve';
import {
	getTypeCurveById,
	getTypeCurveDailyFits,
	getTypeCurveMonthlyFits,
	getTypeCurves,
	getTypeCurvesHead,
} from './controllers';
import { TypeCurveNotFoundError } from './validation';

import { mockExpress } from '@test/express-mocks';

const generateTypeCurveFit = (i: number) => ({
	align: generateEnum(i, TYPE_CURVE_FIT_ALIGN),
	type: generateEnum(i, TYPE_CURVE_FIT_TYPE),
});

const getTypeCurveArray = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		id: generateObjectId(i),
		forecast: generateObjectId(i),
		name: generateString(i),
		fits: {
			oil: generateTypeCurveFit(i),
			gas: generateTypeCurveFit(i),
			water: generateTypeCurveFit(i),
		},
	}));

describe('v1/projects/:projectId/type-curves/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getTypeCurvesHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/type-curves';

		res.locals = {
			service: {
				getTypeCurvesCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getTypeCurvesHead, READ_RECORD_LIMIT);
	});
	test('getTypeCurvesHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/type-curves`;

		req.originalUrl = originalUrl;

		let count = 0;

		const getTypeCurvesCount = jest.fn(() => count);

		res.locals = {
			service: {
				getTypeCurvesCount,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getTypeCurvesHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getTypeCurvesHead(req, res);
		expect(getTypeCurvesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getTypeCurvesHead(req, res);
		expect(getTypeCurvesCount).toHaveBeenLastCalledWith({}, project);
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
		await getTypeCurvesHead(req, res);
		expect(getTypeCurvesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getTypeCurvesHead(req, res);
		expect(getTypeCurvesCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getTypeCurvesCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'default1', a: 'b' };
		count = 35;
		await expect(getTypeCurvesHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getTypeCurvesCount.mock.calls.length).toBe(serviceCallTimes);
	});
	test('getTypeCurves throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/type-curves`;

		res.locals = {
			service: {
				getTypeCurves: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getTypeCurves, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getTypeCurves(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getTypeCurves(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getTypeCurves(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getTypeCurves(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getTypeCurves(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getTypeCurves(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getTypeCurves(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getTypeCurves(req, res)).rejects.toThrow(ValidationError);
	});

	test('getTypeCurves runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/type-curves`;

		req.originalUrl = originalUrl;

		let result: ApiTypeCurve[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceTypeCurve = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getTypeCurves: serviceTypeCurve,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getTypeCurveArray(3);
		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getTypeCurveArray(3));

		result = getTypeCurveArray(25);
		hasNext = true;
		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getTypeCurveArray(25));

		req.query = { skip: '25' };
		result = getTypeCurveArray(25);
		hasNext = true;
		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getTypeCurveArray(25));

		req.query = { skip: '30', take: '10' };
		result = getTypeCurveArray(5);
		hasNext = false;
		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getTypeCurveArray(5);
		hasNext = false;
		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(
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

		const serviceCallTimes = serviceTypeCurve.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'default1', a: 'b' };
		result = getTypeCurveArray(5);
		hasNext = false;
		await expect(getTypeCurves(req, res)).rejects.toThrow(FieldNameFilterError);
		expect(serviceTypeCurve.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', name: 'default1', sort: '-name' };
		result = getTypeCurveArray(5);
		hasNext = false;
		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(
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
		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getTypeCurveArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getTypeCurveArray(15);
		hasNext = true;
		cursor = null;
		await getTypeCurves(req, res);
		expect(serviceTypeCurve).toHaveBeenLastCalledWith(
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
	test('getTypeCurveById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getTypeCurveById(req, res)).rejects.toThrow(TypeCurveNotFoundError);
	});

	describe('getTypeCurveDailyFits', () => {
		test('throw TypeCurveNotFoundError if typecurve is not found', async () => {
			const { req, res } = mockExpress();
			req.params = { id: Types.ObjectId().toString() };

			res.locals = buildLocal();

			res.sendStatus = jest.fn();

			await expect(getTypeCurveDailyFits(req, res)).rejects.toThrow(TypeCurveNotFoundError);
		});
		test('throw TypeError if typecurve id is not a valid objectId', async () => {
			const { req, res } = mockExpress();
			req.params = { id: 'invalid ' };

			res.locals = buildLocal();

			res.sendStatus = jest.fn();

			await expect(getTypeCurveDailyFits(req, res)).rejects.toThrow(TypeError);
		});

		test('call getVolumeFits to get daily typecurve volume production', async () => {
			const { req, res } = mockExpress();
			const projectId = Types.ObjectId();
			const typeCurveId = Types.ObjectId().toString();
			req.params = { id: typeCurveId };

			res.locals = buildLocal(projectId, true);

			res.sendStatus = jest.fn();
			await getTypeCurveDailyFits(req, res);

			expect(res.locals.service.getVolumeFits).toHaveBeenCalledWith(typeCurveId, 'daily', { skip: 0, limit: 25 });
		});
	});

	describe('getTypeCurveMonthlyFits', () => {
		test('throw TypeCurveNotFoundError if typecurve is not found', async () => {
			const { req, res } = mockExpress();
			req.params = { id: Types.ObjectId().toString() };

			res.locals = buildLocal();

			res.sendStatus = jest.fn();

			await expect(getTypeCurveMonthlyFits(req, res)).rejects.toThrow(TypeCurveNotFoundError);
		});

		test('throw TypeError if typecurve id is not a valid objectId', async () => {
			const { req, res } = mockExpress();
			req.params = { id: 'invalid ' };

			res.locals = buildLocal();

			res.sendStatus = jest.fn();

			await expect(getTypeCurveMonthlyFits(req, res)).rejects.toThrow(TypeError);
		});

		test('call getVolumeFits to get monthly typecurve volume production', async () => {
			const { req, res } = mockExpress();
			const projectId = Types.ObjectId();
			const typeCurveId = Types.ObjectId().toString();
			req.params = { id: typeCurveId };

			res.locals = buildLocal(projectId, true);

			res.sendStatus = jest.fn();
			await getTypeCurveMonthlyFits(req, res);

			expect(res.locals.service.getVolumeFits).toHaveBeenCalledWith(typeCurveId, 'monthly', {
				skip: 0,
				limit: 25,
			});
		});
	});
});

const buildLocal = (projectId: Types.ObjectId = Types.ObjectId(), typeCurveExists = false) => ({
	service: {
		getById: () => null,
		exists: () => typeCurveExists,
		getVolumeFits: jest.fn(() => []),
	},
	project: { _id: projectId },
});
