import { NextFunction, Request, RequestHandler, Response } from 'express';

import { connectToDb } from '../database';
import logger from '../helpers/logger';

import { ITenantCacheEntry } from './tenant-cache';

export const dbResolver = (): RequestHandler => {
	return async function dbResolver(req: Request, res: Response, next: NextFunction): Promise<void> {
		const { cachedTenant } = res.locals as { cachedTenant: ITenantCacheEntry };

		const info = await cachedTenant.get('info');
		if (!info) {
			// mostly to comply with type checks but in practice this should not happen
			throw new Error('Tenant information not set');
		}
		const { dbConnectionString, name } = info;

		let dbConnection = cachedTenant.get('connection');

		if (!dbConnection) {
			dbConnection = connectToDb(dbConnectionString, name);

			dbConnection.catch((error) => {
				cachedTenant.delete('connection');
				logger.error('Tenant DB connection failed:', error);
			});

			cachedTenant.set('connection', dbConnection);
		}

		next();
	};
};
