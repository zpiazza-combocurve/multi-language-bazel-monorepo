import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Connection } from 'mongoose';

import { ContextConstructor } from '../base-context';
import { ITenantInfo } from '../tenant';

import { ITenantCacheEntry } from './tenant-cache';

export const contextResolver = <T extends ContextConstructor>(ContextClass: T): RequestHandler => {
	const createContext = (info: ITenantInfo, connection: Connection) => new ContextClass(info, connection);

	return async function contextResolver(req: Request, res: Response, next: NextFunction): Promise<void> {
		const { cachedTenant } = res.locals as { cachedTenant: ITenantCacheEntry };

		const [info, connection] = await Promise.all([cachedTenant.get('info'), cachedTenant.get('connection')]);
		if (!info) {
			// mostly to comply with type checks but in practice this should not happen
			throw new Error('Tenant information not set');
		}
		if (!connection) {
			// mostly to comply with type checks but in practice this should not happen
			throw new Error('DB connection not established');
		}

		cachedTenant.getOrSet('context', () => createContext(info, connection));
		next();
	};
};
