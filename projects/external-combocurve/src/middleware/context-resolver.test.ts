import { Request, Response } from 'express';
import { Connection } from 'mongoose';

import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { ITenantInfo } from '@src/tenant';

import { contextResolver } from './context-resolver';
import { TenantCache } from './tenant-cache';

import { getTenantInfo, TENANT_NAME } from '@test/tenant';
import { mockExpress } from '@test/express-mocks';
import { TestContext } from '@test/context';

let mongoUri: string;
let infoPromise: Promise<ITenantInfo>;
let connectionPromise: Promise<Connection>;

let req: Request;
let res: Response;

describe('middleware/context-resolver', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		infoPromise = getTenantInfo(mongoUri);
		connectionPromise = connectToDb(mongoUri);
	});

	beforeEach(async () => {
		({ req, res } = mockExpress());

		const cachedTenant = new TenantCache()
			.getFor(TENANT_NAME)
			.set('info', infoPromise)
			.set('connection', connectionPromise);

		res.locals.cachedTenant = cachedTenant;
	});

	afterAll(async () => {
		const connection = await connectionPromise;
		await connection.close();
	});

	test('contextResolver', async () => {
		const middleware = contextResolver(TestContext);

		const next = jest.fn(async (error) => {
			expect(error).toBeFalsy();
			expect(res.locals.cachedTenant.get('context')).toBeInstanceOf(TestContext);
		});

		await middleware(req, res, next);

		expect(next).toHaveBeenCalled();
	});
});
