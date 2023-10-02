import { Connection, Types } from 'mongoose';

import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { getPipeline } from '@src/helpers/mongo-pipeline';
import { ITypeCurve2 } from '@src/models/type-curve';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { postApi } from '@src/helpers/request';

import { ApiContextV1 } from '../../context';
import { BaseProjectResolved } from '../fields';

import { basePipeline, TypeCurveService } from './service';
import { toApiTypeCurve } from './fields/type-curve';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';
import typeCurveFits from '@test/fixtures/type-curve-fits.json';
import typeCurves from '@test/fixtures/type-curves.json';

jest.mock('@src/helpers/request');

let mongoUri: string;
let connection: Connection;
let service: TypeCurveService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let projectScopeFilter: { project: Types.ObjectId };

describe('v1/projects/:projectId/type-curves/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new TypeCurveService(context);

		await context.models.TypeCurveModel.bulkWrite(
			typeCurves.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);

		await context.models.TypeCurveFitModel.bulkWrite(
			typeCurveFits.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);
	});
	beforeEach(() => {
		postApi.mockClear();
	});
	afterAll(async () => {
		await connection.close();
	});
	test('getTypeCurves', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		const count = await context.models.TypeCurveModel.countDocuments({ ...projectScopeFilter });

		await expect(service.getTypeCurves(0, 0, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let pipeline = getPipeline(basePipeline, { filters: { ...projectScopeFilter } });
		let results = await context.models.TypeCurveModel.aggregate<ITypeCurve2>(pipeline);
		await expect(service.getTypeCurves(0, count + 1, {}, {}, project)).resolves.toStrictEqual({
			result: results.map(toApiTypeCurve),
			hasNext: false,
			cursor: null,
		});

		pipeline = getPipeline(basePipeline, {
			filters: { ...projectScopeFilter },
			sort: { _id: 1 },
			skip: count - 1,
			limit: 1,
		});
		results = await context.models.TypeCurveModel.aggregate<ITypeCurve2>(pipeline);
		await expect(service.getTypeCurves(count - 1, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: results.map(toApiTypeCurve),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		pipeline = getPipeline(basePipeline, {
			filters: { ...projectScopeFilter },
			sort: { name: -1 },
			skip: count - 1,
			limit: 1,
		});
		results = await context.models.TypeCurveModel.aggregate<ITypeCurve2>(pipeline);
		await expect(service.getTypeCurves(count - 1, 1, { name: -1 }, {}, project)).resolves.toStrictEqual({
			result: results.map(toApiTypeCurve),
			hasNext: false,
			cursor: null,
		});

		pipeline = getPipeline(basePipeline, {
			filters: { name: 'default1', ...projectScopeFilter },
		});
		results = await context.models.TypeCurveModel.aggregate<ITypeCurve2>(pipeline);
		await expect(service.getTypeCurves(0, count + 1, {}, { name: ['default1'] }, project)).resolves.toStrictEqual({
			result: results.map(toApiTypeCurve),
			hasNext: false,
			cursor: null,
		});

		pipeline = getPipeline(basePipeline, {
			filters: { ...projectScopeFilter },
			limit: 1,
		});
		results = await context.models.TypeCurveModel.aggregate<ITypeCurve2>(pipeline);
		await expect(service.getTypeCurves(0, 1, {}, { notTypeCurveField: ['test'] }, project)).resolves.toStrictEqual({
			result: results.map(toApiTypeCurve),
			hasNext: true,
			cursor: null,
		});

		pipeline = getPipeline(basePipeline, {
			filters: { ...projectScopeFilter },
			limit: 1,
		});
		results = await context.models.TypeCurveModel.aggregate<ITypeCurve2>(pipeline);
		await expect(service.getTypeCurves(0, 1, {}, {}, project)).resolves.toStrictEqual({
			result: results.map(toApiTypeCurve),
			hasNext: true,
			cursor: null,
		});
	});
	test('getTypeCurvesCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		let count = await context.models.TypeCurveModel.countDocuments({ ...projectScopeFilter });
		await expect(service.getTypeCurvesCount({}, project)).resolves.toBe(count);

		count = await context.models.TypeCurveModel.countDocuments({ name: 'default1', ...projectScopeFilter });
		await expect(service.getTypeCurvesCount({ name: ['default1'] }, project)).resolves.toBe(count);

		count = await context.models.TypeCurveModel.countDocuments({ ...projectScopeFilter });
		await expect(service.getTypeCurvesCount({ notTypeCurveField: ['test'] }, project)).resolves.toBe(count);
	});
	test('getById', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		await expect(
			service.getById(Types.ObjectId(), { name: 'Test Project', _id: Types.ObjectId() }),
		).resolves.toBeNull();

		const pipeline = getPipeline(basePipeline, {
			filters: {
				_id: Types.ObjectId('5f971a8f6749f60012dcb93a'),
				...projectScopeFilter,
			},
		});
		const [typeCurve] = await context.models.TypeCurveModel.aggregate<ITypeCurve2>(pipeline);
		await expect(service.getById(Types.ObjectId('5f971a8f6749f60012dcb93a'), project)).resolves.toStrictEqual(
			toApiTypeCurve(typeCurve),
		);

		await expect(service.getById(Types.ObjectId('5f971a8f6749f60012dcb93b'), project)).resolves.toBeNull();
	});

	test('exists', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		await expect(service.exists(Types.ObjectId('5f971a8f6749f60012dcb93a'), project._id)).resolves.toBeTruthy();
		await expect(service.exists(Types.ObjectId('5f971a8f6749f60012dcb93b'), project._id)).resolves.toBeFalsy();
	});

	test('getVolumeFits requests is_monthly is false for daily volume flex_cc request', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const typeCurveId = Types.ObjectId().toString();
		postApi.mockResolvedValue([]);

		await service.getVolumeFits(typeCurveId, 'daily', { skip: 0, limit: 25 });
		expect(postApi).toHaveBeenLastCalledWith(
			`/tc-mass-edit/external-tc-volumes`,
			{
				skip: 0,
				limit: 25,
				tc_id: [typeCurveId],
				is_monthly: false,
			},
			3,
		);
	});

	test('getVolumeFits requests is_monthly is true for daily volume flex_cc request', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		const typeCurveId = Types.ObjectId().toString();
		postApi.mockResolvedValue([]);

		await service.getVolumeFits(typeCurveId, 'monthly', { skip: 0, limit: 25 });
		expect(postApi).toHaveBeenLastCalledWith(
			`/tc-mass-edit/external-tc-volumes`,
			{
				skip: 0,
				limit: 25,
				tc_id: [typeCurveId],
				is_monthly: true,
			},
			3,
		);
	});
});
