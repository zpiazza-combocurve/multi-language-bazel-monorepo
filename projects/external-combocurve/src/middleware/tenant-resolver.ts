import { NextFunction, Request, RequestHandler, Response } from 'express';

import { getRequestTenant } from '@src/helpers/tenant';

import { getTenantInfo } from '../tenant';

import { TenantCache } from './tenant-cache';

export const tenantResolver = (): RequestHandler => {
	const cache = new TenantCache();

	return function tenantResolver(req: Request, res: Response, next: NextFunction): void {
		const tenant = getRequestTenant(req);

		const cachedTenant = cache.getFor(tenant);
		cachedTenant.getOrSet('info', () => getTenantInfo(tenant));
		cachedTenant.getOrSet('name', () => tenant);
		res.locals.cachedTenant = cachedTenant;
		next();
	};
};
