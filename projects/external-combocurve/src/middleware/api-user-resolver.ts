import { NextFunction, Request, RequestHandler, Response } from 'express';

import config from '@src/config';
import { IBaseContext } from '@src/base-context';

import { ITenantCacheEntry } from './tenant-cache';

export const apiUserResolver = (): RequestHandler => {
	return async function apiUser(req: Request, res: Response, next: NextFunction): Promise<void> {
		const { cachedTenant } = res.locals as { cachedTenant: ITenantCacheEntry };

		const context = cachedTenant.get('context') as IBaseContext;

		if (!context) {
			// mostly to comply with type checks but in practice this should not happen
			throw new Error('DB connection not established');
		}
		const userId = (
			await context.models.UserModel.findOne({ email: config.restApiUserEmail }, '_id').lean()
		)?._id.toString();

		if (userId) {
			cachedTenant.getOrSet('apiUserId', () => userId);
		}

		next();
	};
};
