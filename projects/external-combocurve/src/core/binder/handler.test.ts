import { Connection } from 'mongoose';

import { ITenantCacheEntry, TenantCache } from '@src/middleware/tenant-cache';
import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IBaseContext } from '@src/base-context';

import { MetadaWrapper } from '../metadata/metada-wrapper';
import { NamingTypes } from '../common';
import { TestModel } from '../test.exports';

import { BindHandler } from './handler';
import { RequestStructure } from './request-structure';

import { getTenantInfo, TENANT_NAME } from '@test/tenant';
import { IMockExpressReturn, mockExpress } from '@test/express-mocks';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/cloud-caller');

type specContext = {
	entry: IBaseContext;
	cache: ITenantCacheEntry;
	connection: Connection;
};

describe('Handler', () => {
	let ctx: specContext;
	let handler: BindHandler<TestModel>;
	let expressMock: IMockExpressReturn;

	beforeAll(async () => {
		const mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		const connection = await connectToDb(mongoUri);
		const context = new TestContext(info, connection) as ApiContextV1;

		const cache = new TenantCache().getFor(TENANT_NAME);
		const entry = cache.getOrSet('context', () => context);

		ctx = {
			cache,
			entry,
			connection,
		};
	});

	beforeEach(() => {
		expressMock = mockExpress();
		expressMock.res.locals.cachedTenant = ctx.cache;

		expressMock.req.query = {};
		expressMock.req.params = {};

		const model = new TestModel();
		const metadata = new MetadaWrapper(model);
		const requestStructure = new RequestStructure(expressMock.req, expressMock.res, metadata, NamingTypes.All);

		handler = new BindHandler<TestModel>(model, expressMock.req, metadata, requestStructure, NamingTypes.All);
	});

	afterAll(async () => {
		await ctx.connection.close();
	});

	it('when everything fine should bind model correctly with no errors', () => {
		// Arrange
		const { req } = expressMock;

		req.body = {
			name: 'test1',
			is_cool: true,
			inner: {
				profession: 'developer',
				yearsOfExperience: 5,
				lookingForJob: true,
			},
			custom: {
				prop1: 'test_prop1',
				prop2: 5,
			},
		};

		req.query = {
			age: '25',
			compositionTest: 'composition_test',
		};

		req.params = {
			id: '5f9b3b3b3b3b3b3b3b3b3b3b',
		};

		// Act
		handler.bind();
		const output = handler.getModel();

		// Assert
		expect(handler.errors).toHaveLength(0);
		expect(output).toBeDefined();
		expect(output.name).toBe('test1');
		expect(output.age).toBe(25);
		expect(output.isCool).toBe(true);
		expect(output.id).toBeDefined();
		expect(output.inner).toBeDefined();
		expect(output.inner?.profession).toBe('developer');
		expect(output.inner?.yearsOfExperience).toBe(5);
		expect(output.inner?.lookingForJob).toBe(true);
		expect(output.commomQueryParams?.compositionTest).toBe('composition_test');
		expect(output.address).toBe('default address');
		expect(output.custom).toBeDefined();
		expect(output.custom?.prop1).toBe('test_prop1');
		expect(output.custom?.prop2).toBe(5);
	});

	it('when unkown fields should register an error', () => {
		// Arrange
		const { req } = expressMock;

		req.params.id = '5f9b3b3b3b3b3b3b3b3b3b3b';
		req.body = {
			name: 'test2',
			is_cool: true,
			inner: {
				innerUnknownField: 'test',
				profession: 'developer',
				yearsOfExperience: 5,
				lookingForJob: true,
			},
			custom: {
				prop1: 'test_prop1',
				prop2: 5,
			},
		};

		handler.bind();

		expect(handler.errors).toHaveLength(1);
		expect(handler.errors[0].message).toBe('Unrecognized field innerUnknownField');
		expect(handler.errors[0].details.location).toBe('inner');
	});
});
