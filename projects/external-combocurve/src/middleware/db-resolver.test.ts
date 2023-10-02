import { Request, Response } from 'express';
import { Connection } from 'mongoose';

import { getMemoryMongoUri } from '@src/test/setup';

import { dbResolver } from './db-resolver';
import { TenantCache } from './tenant-cache';

import { getTenantInfo, TENANT_NAME } from '@test/tenant';
import { mockExpress } from '@test/express-mocks';

let req: Request;
let res: Response;
let connectionPromise: Promise<Connection>;

describe('middleware/db-resolver', () => {
	beforeEach(async () => {
		({ req, res } = mockExpress());

		const infoPromise = getTenantInfo(await getMemoryMongoUri());
		const cachedTenant = new TenantCache().getFor(TENANT_NAME).set('info', infoPromise);

		res.locals.cachedTenant = cachedTenant;
	});

	afterEach(async () => {
		const connection = await connectionPromise;
		await connection.close();
	});

	test('dbResolver', async () => {
		const middleware = dbResolver();

		const next = jest.fn((error) => {
			expect(error).toBeFalsy();
			connectionPromise = res.locals.cachedTenant.get('connection');
			expect(connectionPromise).toBeInstanceOf(Promise);
		});

		await middleware(req, res, next);

		expect(next).toHaveBeenCalled();
	});
});
