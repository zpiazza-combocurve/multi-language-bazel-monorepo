import { NextFunction, Request, RequestHandler, Response } from 'express';

import { IBaseContext } from '../base-context';

import { ITenantCacheEntry } from './tenant-cache';

export const serviceResolver = <TContext extends IBaseContext, TProperty extends keyof TContext>(
	serviceAttribute: TProperty,
	fieldName = 'service',
): RequestHandler => {
	return async function serviceResolver(req: Request, res: Response, next: NextFunction): Promise<void> {
		const { cachedTenant } = res.locals as { cachedTenant: ITenantCacheEntry };

		const context = cachedTenant.get('context');

		if (!context) {
			// mostly to comply with type checks but in practice this should not happen
			throw new Error('Context not created');
		}
		const service = (context as TContext)[serviceAttribute];

		if (!service) {
			throw new Error(`Context does not have service ${String(serviceAttribute)}`);
		}
		res.locals[fieldName] = service;
		next();
	};
};
