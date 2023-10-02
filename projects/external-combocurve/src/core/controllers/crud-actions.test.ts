import { Connection, FilterQuery } from 'mongoose';

import { getPaginationData, getPaginationDataWithTotal, getPaginationHeaders } from '@src/api/v1/pagination';
import { ITenantCacheEntry, TenantCache } from '@src/middleware/tenant-cache';
import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { getUrlData } from '@src/helpers/express';
import { IBaseEconModel } from '@src/models/econ/econ-models';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';

import { CommandRequest, DeleteRequest } from '../requests/base';
import { fromBody } from '../metadata/metadata';
import { HttpMessageContext } from '../common';
import { PaginatedRequest } from '../requests/mongo';

import { deleteHandler, getMany, getOne, headCount, upsertMany } from './crud-actions';
import { RouteContext } from './base';

import { getTenantInfo, TENANT_NAME } from '@test/tenant';
import { IMockExpressReturn, mockExpress } from '@test/express-mocks';
import assumptions from '@test/fixtures/assumptions.json';
import { TestContext } from '@test/context';

let mockSkip: number;
let mockTake: number;

let mockValidate: () => Promise<boolean>;
let mockFilter: () => FilterQuery<IBaseEconModel>;
let mockProjection: () => unknown;
let mockSort: () => unknown;
let mockPaseFn: (item: IBaseEconModel) => string;
let mockHandle: (input: HttpMessageContext) => Promise<IMultiStatusResponse | undefined>;
let mockDeleteHandle: (input: HttpMessageContext) => Promise<number | undefined>;

class PaginatedTestRequest extends PaginatedRequest<IBaseEconModel, string> {
	@fromBody({ expects: 'number' })
	public testProp?: number;

	constructor() {
		super('assumptions', mockTake, mockSkip);
	}

	public validate(): Promise<boolean> {
		return mockValidate();
	}

	filter(): FilterQuery<IBaseEconModel> {
		return mockFilter() ?? {};
	}

	public projection(): unknown {
		return mockProjection();
	}

	public sort(): unknown {
		return mockSort();
	}

	public parseDoc(item: IBaseEconModel): string {
		return mockPaseFn(item);
	}
}

class CommandTestRequest extends CommandRequest<IMultiStatusResponse> {
	statusCode = 211;

	@fromBody({ expects: 'number' })
	public testProp?: number;

	public validate(): Promise<boolean> {
		return mockValidate();
	}

	handle(input: HttpMessageContext): Promise<IMultiStatusResponse | undefined> {
		return mockHandle(input);
	}
}

class DeleteTestRequest extends DeleteRequest {
	statusCode = 301;

	@fromBody({ expects: 'number' })
	public testProp?: number;

	public validate(): Promise<boolean> {
		return mockValidate();
	}

	handle(input: HttpMessageContext): Promise<number | undefined> {
		return mockDeleteHandle(input);
	}
}

let mongoUri: string;
let ctx: RouteContext;
let context: ApiContextV1;
let connection: Connection;
let cache: ITenantCacheEntry;
let expressMock: IMockExpressReturn;

describe('crud-actions', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;

		cache = new TenantCache().getFor(TENANT_NAME);
		cache.getOrSet('context', () => context);

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

	afterAll(() => {
		connection.close();
	});

	beforeEach(() => {
		expressMock = mockExpress();

		expressMock.req.query = {};
		expressMock.req.params = {};
		expressMock.req.body = { testProp: 1 };
		expressMock.req.originalUrl = 'http://localhost/api/head-count';
		expressMock.res.locals.cachedTenant = cache;

		mockDeleteHandle = mockValidate = mockHandle = mockSort = mockProjection = mockPaseFn = mockFilter = jest.fn();

		ctx = {
			method: 'head',
		};
	});

	function expectMockReadFunctions(validate = 0, filter = 0, projection = 0, sort = 0, parse = 0) {
		expect(mockSort).toHaveBeenCalledTimes(sort);
		expect(mockPaseFn).toHaveBeenCalledTimes(parse);
		expect(mockFilter).toHaveBeenCalledTimes(filter);
		expect(mockValidate).toHaveBeenCalledTimes(validate);
		expect(mockProjection).toHaveBeenCalledTimes(projection);
	}

	function getCountPageDataInfo(expectedCount: number) {
		const urlData = getUrlData(expressMock.req);
		const paginationData = getPaginationDataWithTotal(urlData, mockSkip, mockTake, expectedCount);

		return getPaginationHeaders(paginationData);
	}

	function getPageDataInfo(hasMore: boolean) {
		const urlData = getUrlData(expressMock.req);
		const paginationData = getPaginationData(urlData, mockSkip, mockTake, hasMore);

		return getPaginationHeaders(paginationData);
	}

	describe('headCount', () => {
		it('should not call the model when found errors on bindind', async () => {
			const { req, res } = expressMock;

			// The testProp is required, without it the model will have errors
			req.body = {};
			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			mockFilter = jest.fn();

			await headCount(PaginatedTestRequest, ctx, req, res);

			expectMockReadFunctions();
			expect(res.json).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('should set the page info', async () => {
			const { req, res } = expressMock;
			const count = await context.models.AssumptionModel.countDocuments({});

			mockTake = 5;
			mockSkip = 8;

			res.set = jest.fn().mockReturnValue(res);
			res.end = jest.fn().mockReturnValue(res);
			mockFilter = jest.fn().mockReturnValue({});

			await headCount(PaginatedTestRequest, ctx, req, res);

			expectMockReadFunctions(0, 1);
			expect(res.end).toHaveBeenCalled();
			expect(res.set).toHaveBeenCalledWith(getCountPageDataInfo(count));
		});
	});

	describe('getMany', () => {
		it('getMany should not call the model when found errors on bindind', async () => {
			const { req, res } = expressMock;

			// The testProp is required, without it the model will have errors
			req.body = {};
			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			mockFilter = jest.fn();
			mockValidate = jest.fn().mockResolvedValue(true);

			await getMany(PaginatedTestRequest, ctx, req, res);

			expectMockReadFunctions();
			expect(res.json).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('getMany should not call the model when validate return false', async () => {
			const { req, res } = expressMock;

			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			mockFilter = jest.fn();
			mockValidate = jest.fn().mockResolvedValue(false);

			await getMany(PaginatedTestRequest, ctx, req, res);

			expectMockReadFunctions(1);
			expect(res.json).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('getMany should set the page info and return items correctly', async () => {
			const { req, res } = expressMock;

			mockTake = 5;
			mockSkip = 8;

			res.set = jest.fn().mockReturnValue(res);
			res.json = jest.fn().mockReturnValue(res);

			mockFilter = jest.fn().mockReturnValue({});
			mockValidate = jest.fn().mockResolvedValue(true);
			mockSort = jest.fn().mockReturnValue({ name: 1 });
			mockPaseFn = jest.fn().mockImplementation((item) => item);
			mockProjection = jest.fn().mockReturnValue({ econ_function: 0, _id: 0 });

			await getMany(PaginatedTestRequest, ctx, req, res);

			const items = await context.models.AssumptionModel.find({}, { _id: 0, econ_function: 0 })
				.sort({ name: 1 })
				.skip(8)
				.limit(5);

			expectMockReadFunctions(1, 1, 1, 1, 5);
			expect(res.json).toHaveBeenCalledWith(items);
			expect(res.set).toHaveBeenCalledWith(getPageDataInfo(true));
		});
	});

	describe('getOne', () => {
		it('getOne should not call the model when found errors on bindind', async () => {
			const { req, res } = expressMock;

			// The testProp is required, without it the model will have errors
			req.body = {};
			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			mockFilter = jest.fn();
			mockValidate = jest.fn().mockResolvedValue(true);

			await getOne(PaginatedTestRequest, ctx, req, res);

			expect(mockSort).not.toHaveBeenCalled();
			expect(mockFilter).not.toHaveBeenCalled();
			expect(mockPaseFn).not.toHaveBeenCalled();
			expect(mockValidate).not.toHaveBeenCalled();
			expect(mockProjection).not.toHaveBeenCalled();

			expect(res.json).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('getOne should not call the model when validate return false', async () => {
			const { req, res } = expressMock;

			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			mockFilter = jest.fn();
			mockValidate = jest.fn().mockResolvedValue(false);

			await getOne(PaginatedTestRequest, ctx, req, res);

			expectMockReadFunctions(1);
			expect(res.json).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('getOne should return notFound when request return nothing', async () => {
			const { req, res } = expressMock;

			const items = await context.models.AssumptionModel.find({ name: 'not_exists' });
			expect(items).toHaveLength(0);

			res.status = jest.fn().mockReturnValue(res);

			mockProjection = jest.fn().mockReturnValue({});
			mockValidate = jest.fn().mockResolvedValue(true);
			mockFilter = jest.fn().mockReturnValue({ name: 'not_exists' });

			await getOne(PaginatedTestRequest, ctx, req, res);

			expectMockReadFunctions(1, 1, 1);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it('getOne should set the page info and return correctly', async () => {
			const { req, res } = expressMock;
			const item = await context.models.AssumptionModel.findOne(
				{ name: 'default2' },
				{ createdBy: 1, unique: 1, project: 1 },
			);

			res.status = jest.fn().mockReturnValue(res);
			res.json = jest.fn().mockReturnValue(res);

			mockValidate = jest.fn().mockResolvedValue(true);
			mockPaseFn = jest.fn().mockImplementation((item) => item);
			mockFilter = jest.fn().mockReturnValue({ name: 'default2' });
			mockProjection = jest.fn().mockReturnValue({ createdBy: 1, unique: 1, project: 1 });

			await getOne(PaginatedTestRequest, ctx, req, res);

			expectMockReadFunctions(1, 1, 1, 0, 1);
			expect(res.json).toHaveBeenCalledWith(item);
			expect(res.status).toHaveBeenCalledWith(200);
		});
	});

	describe('upsertMany', () => {
		it('should not call the model when validation returns false', async () => {
			const { req, res } = expressMock;

			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);
			mockValidate = jest.fn().mockResolvedValue(false);

			await upsertMany(CommandTestRequest, ctx, req, res);

			expect(mockValidate).toHaveBeenCalledTimes(1);
			expect(mockHandle).not.toHaveBeenCalled();

			expect(res.json).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('should not set status code when handle method returns undefined', async () => {
			const { req, res } = expressMock;

			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			mockValidate = jest.fn().mockResolvedValue(true);
			mockHandle = jest.fn().mockResolvedValue(undefined);

			await upsertMany(CommandTestRequest, ctx, req, res);

			expect(mockHandle).toHaveBeenCalledTimes(1);
			expect(mockValidate).toHaveBeenCalledTimes(1);

			expect(res.json).not.toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it('should set status and json when handle return something', async () => {
			const { req, res } = expressMock;

			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			mockValidate = jest.fn().mockResolvedValue(true);
			mockHandle = jest.fn().mockResolvedValue({
				successCount: 1,
				failedCount: 0,
				results: [
					{
						status: 'Created',
						code: 201,
						chosenID: '5f9b3b3b9b3b9b3b9b3b9b3b',
					},
				],
			});

			await upsertMany(CommandTestRequest, ctx, req, res);

			expect(mockHandle).toHaveBeenCalledTimes(1);
			expect(mockValidate).toHaveBeenCalledTimes(1);

			expect(res.json).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(211);
		});
	});

	describe('deleteHandler', () => {
		it('should not call the model when found errors on bindind', async () => {
			const { req, res } = expressMock;

			// The testProp is required, without it the model will have errors
			req.body = {};

			mockDeleteHandle = jest.fn();
			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			await deleteHandler(DeleteTestRequest, ctx, req, res);

			expect(res.json).toHaveBeenCalled();
			expect(mockDeleteHandle).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('should not call the model when validation returns false', async () => {
			const { req, res } = expressMock;

			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);
			mockValidate = jest.fn().mockResolvedValue(false);

			await deleteHandler(DeleteTestRequest, ctx, req, res);

			expect(mockValidate).toHaveBeenCalledTimes(1);
			expect(mockDeleteHandle).not.toHaveBeenCalled();

			expect(res.json).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('should not set status code when handle method returns undefined', async () => {
			const { req, res } = expressMock;

			res.json = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			mockValidate = jest.fn().mockResolvedValue(true);
			mockDeleteHandle = jest.fn().mockResolvedValue(undefined);

			await deleteHandler(DeleteTestRequest, ctx, req, res);

			expect(mockValidate).toHaveBeenCalledTimes(1);
			expect(mockDeleteHandle).toHaveBeenCalledTimes(1);

			expect(res.json).not.toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it('should set status and json when handle return something', async () => {
			const { req, res } = expressMock;

			res.set = jest.fn().mockReturnValue(res);
			res.status = jest.fn().mockReturnValue(res);

			mockValidate = jest.fn().mockResolvedValue(true);
			mockDeleteHandle = jest.fn().mockResolvedValue(10);

			await deleteHandler(DeleteTestRequest, ctx, req, res);

			expect(mockValidate).toHaveBeenCalledTimes(1);
			expect(mockDeleteHandle).toHaveBeenCalledTimes(1);

			expect(res.set).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(301);
		});
	});
});
