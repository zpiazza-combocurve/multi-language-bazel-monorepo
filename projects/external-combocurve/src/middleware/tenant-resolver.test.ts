import { Request, Response } from 'express';

import { tenantResolver } from './tenant-resolver';

import { mockExpress } from '@test/express-mocks';

let req: Request;
let res: Response;

const fakeUserInfo =
	'eyJjbGFpbXMiOiJ7XCJpc3NcIjpcImV4dGVybmFsLWFwaS10ZXN0QGZha2UtY29tYm9jdXJ2ZS5xYS5jb21cIixcInN1YlwiOlwiZXh0ZXJuYWwtYXBpLXRlc3RAZmFrZS1jb21ib2N1cnZlLnFhLmNvbVwiLFwiYXVkXCI6XCJ3b3JsZFwiLFwiaWF0XCI6MTU5NzE4MDQwMyxcImV4cFwiOjE1OTcxODQwMDN9IiwiaXNzdWVyIjoiZXh0ZXJuYWwtYXBpLXRlc3RAZmFrZS1jb21ib2N1cnZlLnFhLmNvbSIsImlkIjoiZXh0ZXJuYWwtYXBpLXRlc3RAZmFrZS1jb21ib2N1cnZlLnFhLmNvbSIsImF1ZGllbmNlcyI6WyJ3b3JsZCJdfQ==';

describe('middleware/tenant-resolver', () => {
	beforeEach(() => {
		({ req, res } = mockExpress({
			headers: {
				'X-Endpoint-API-UserInfo': fakeUserInfo,
			},
		}));
	});

	test.skip('tenantResolver', async () => {
		const middleware = tenantResolver();

		const next = jest.fn(() => {
			expect(res.locals.cachedTenant).toBeInstanceOf(Object);
			expect(res.locals.cachedTenant.constructor.name).toBe('TenantCacheEntry');
		});

		await middleware(req, res, next);

		expect(next).toHaveBeenCalled();
	});
});
