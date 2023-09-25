import { NextFunction, Request, RequestHandler, Response } from 'express';

import { BaseContext, BaseService, ServiceConstructor } from '../base-context';
import { ITenantCacheEntry } from './tenant-cache';

export const serviceResolver = <TContext extends BaseContext, TService extends BaseService<TContext>>(
	ServiceClass: ServiceConstructor<TContext, TService>,
	fieldName = 'service'
): RequestHandler => {
	const createService = (context: TContext) => new ServiceClass(context);

	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { cachedTenant } = res.locals as { cachedTenant: ITenantCacheEntry };

		const context = cachedTenant.get('context');

		if (!context) {
			// mostly to comply with type checks but in practice this should not happen
			throw new Error('Context not created');
		}
		const service = createService(context as TContext);

		res.locals[fieldName] = service;
		next();
	};
};
