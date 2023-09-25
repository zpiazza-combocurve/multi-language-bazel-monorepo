import { NextFunction, Request, RequestHandler, Response } from 'express';

import { connectToDb } from '../database';
import { ITenantCacheEntry } from './tenant-cache';

export const dbResolver = (): RequestHandler => {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { cachedTenant } = res.locals as { cachedTenant: ITenantCacheEntry };

		const info = await cachedTenant.get('info');
		if (!info) {
			// mostly to comply with type checks but in practice this should not happen
			throw new Error('Tenant information not set');
		}
		const { dbConnectionString } = info;

		cachedTenant.getOrSet('connection', () => connectToDb(dbConnectionString));
		next();
	};
};
