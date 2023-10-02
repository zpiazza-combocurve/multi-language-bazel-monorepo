import { Connection, Types } from 'mongoose';
import { omit } from 'lodash';
import { StatusCodes } from 'http-status-codes';

import { Expenses_KEY, IExpenses } from '@src/models/econ/expenses';
import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IRecordStatus } from '@src/api/v1/multi-status';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { postApi } from '@src/helpers/request';

import { BaseProjectResolved } from '../../fields';

import { ExpensesService } from './service';
import { toApiExpenses } from './fields/expenses';

import assumptions from '@test/fixtures/assumptions.json';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

const { CREATED, OK } = StatusCodes;

jest.mock('@src/helpers/request');

const assumptionKey = Expenses_KEY;

let mongoUri: string;
let connection: Connection;
let service: ExpensesService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let projectScopeFilter;

describe('v1/projects/:projectId/econ-models/expenses/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ExpensesService(context);

		await context.models.AssumptionModel.bulkWrite(
			assumptions.map((item) => ({
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

	test('getExpenses', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		const count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });

		await expect(service.getExpenses(0, 0, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter });
		await expect(service.getExpenses(0, count + 1, {}, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiExpenses(r as IExpenses)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getExpenses(count - 1, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiExpenses(r as IExpenses)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ name: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getExpenses(count - 1, 1, { name: -1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiExpenses(r as IExpenses)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ name: 'test1', assumptionKey, ...projectScopeFilter });
		await expect(service.getExpenses(0, count + 1, {}, { name: ['test1'] }, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiExpenses(r as IExpenses)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ unique: true, assumptionKey, ...projectScopeFilter });
		await expect(service.getExpenses(0, count + 1, {}, { unique: ['true'] }, project)).resolves.toStrictEqual({
			result: results.map((r) => toApiExpenses(r as IExpenses)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(
			service.getExpenses(0, 1, { id: 1 }, { notEscalationField: ['test'] }, project),
		).resolves.toStrictEqual({
			result: results.map((r) => toApiExpenses(r as IExpenses)),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getExpensesCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		let count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });
		await expect(service.getExpensesCount({}, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			name: 'test1',
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getExpensesCount({ name: ['test1'] }, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			unique: true,
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getExpensesCount({ unique: ['true'] }, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });
		await expect(service.getExpensesCount({ notForecastField: ['test'] }, project)).resolves.toBe(count);
	});

	test('getById', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		await expect(
			service.getById(Types.ObjectId(), { name: 'Test Project', _id: Types.ObjectId() }),
		).resolves.toBeNull();

		const Expenses = (await context.models.AssumptionModel.findOne({
			_id: '645189763993f600215c7e1a',
			...projectScopeFilter,
		})) as IExpenses;
		await expect(service.getById(Types.ObjectId('645189763993f600215c7e1a'), project)).resolves.toStrictEqual(
			toApiExpenses(Expenses),
		);

		await expect(service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'), project)).resolves.toBeNull();
	});

	test('create', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		let result = await service.create([]);
		expect(postApi).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let Expenses = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		let creates: Array<IExpenses | undefined> = Expenses.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IExpenses,
		);

		result = await service.create(creates);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: assumptionKey,
				econ_functions: Expenses.map(({ econ_function }) => econ_function),
			},
			3,
		);

		expect(result).toStrictEqual({
			results: Expenses.map(({ name }) => ({
				status: 'Created',
				code: CREATED,
				name,
			})),
		});

		Expenses = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		creates = Expenses.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IExpenses,
		);
		creates.splice(-1, 0, undefined);

		result = await service.create(creates);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: assumptionKey,
				econ_functions: Expenses.map(({ econ_function }) => econ_function),
			},
			3,
		);

		const expectResults: Array<IRecordStatus | undefined> = Expenses.map(({ name }) => ({
			status: 'Created',
			code: CREATED,
			name,
		}));
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});

	test('upsert', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		let result = await service.upsert([], project._id);
		expect(postApi).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let Expenses = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		let ExpensesWithoutId: Array<IExpenses | undefined> = Expenses.map((r) => omit(r, '_id') as IExpenses);

		result = await service.upsert(ExpensesWithoutId, project._id);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: assumptionKey,
				econ_functions: Expenses.map(({ econ_function }) => econ_function),
			},
			3,
		);

		expect(result).toStrictEqual({
			results: Expenses.map(({ name }) => ({
				status: 'OK',
				code: OK,
				name,
			})),
		});

		Expenses = await context.models.AssumptionModel.find({
			assumptionKey,
			...projectScopeFilter,
		}).lean();
		ExpensesWithoutId = Expenses.map((r) => omit(r, '_id') as IExpenses);
		ExpensesWithoutId.splice(-1, 0, undefined);

		result = await service.upsert(ExpensesWithoutId, project._id);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: assumptionKey,
				econ_functions: Expenses.map(({ econ_function }) => econ_function),
			},
			3,
		);

		const expectResults: Array<IRecordStatus | undefined> = Expenses.map(({ name }) => ({
			status: 'OK',
			code: OK,
			name,
		}));
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});
});
