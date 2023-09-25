/**
 * Middleware to set `res.locals.tenant`, containing the info for the tenant making the request that will be used for
 * other middlewares
 */
import { NextFunction, Request, RequestHandler, Response } from 'express';

import { IBaseTenantInfo } from '../helpers/tenant';
import { TenantCache } from './tenant-cache';

export interface IBaseRequestTenant {
	name: Readonly<string>;
}

export const tenantResolver = <TRequestTenant extends IBaseRequestTenant, TTenantInfo extends IBaseTenantInfo>(
	getRequestTenant: (req: Request) => TRequestTenant,
	getTenantInfo: (requestTenant: TRequestTenant) => Promise<TTenantInfo>
): RequestHandler => {
	const cache = new TenantCache();

	return (req: Request, res: Response, next: NextFunction): void => {
		const tenant = getRequestTenant(req);

		const cachedTenant = cache.getFor(tenant.name);
		cachedTenant.getOrSet('info', () => getTenantInfo(tenant));

		res.locals.cachedTenant = cachedTenant;
		next();
	};
};
