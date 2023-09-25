import { NextFunction, Request, RequestHandler, Response } from 'express';

import { BaseContext, ContextConstructor, IBaseContextParams } from '../base-context';
import { LDFeatureFlagKey } from '../feature-flags';
import { EvaluateFeatureFlag } from './launch-darkly-middleware';
import { ITenantCacheEntry } from './tenant-cache';

export const getBaseContextParams = async (
	cachedTenant: ITenantCacheEntry,
	dalEnabled: boolean
): Promise<IBaseContextParams> => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let dalClient: any = undefined;
	const [info, connection] = await Promise.all([cachedTenant.get('info'), cachedTenant.get('connection')]);
	if (!info) {
		// mostly to comply with type checks but in practice this should not happen
		throw new Error('Tenant information not set');
	}

	if (!connection) {
		// mostly to comply with type checks but in practice this should not happen
		throw new Error('DB connection not established');
	}

	if (dalEnabled) {
		dalClient = await cachedTenant.get('dalClient');

		if (!dalClient) {
			// mostly to comply with type checks but in practice this should not happen
			throw new Error('DAL client not initialized');
		}
	}

	return { db: connection, tenant: info, dalClient };
};

export const contextResolver = <TContext extends BaseContext, TContextParams extends IBaseContextParams>(
	ContextClass: ContextConstructor<TContext, TContextParams>,
	getContextParams: (cachedTenant: ITenantCacheEntry, dalEnabled: boolean) => Promise<TContextParams>
): RequestHandler => {
	const createContext = (params: TContextParams) => new ContextClass(params);

	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { cachedTenant, evaluateFeatureFlag } = res.locals as {
			cachedTenant: ITenantCacheEntry;
			evaluateFeatureFlag: EvaluateFeatureFlag;
		};

		const contextParams = await getContextParams(
			cachedTenant,
			await evaluateFeatureFlag(LDFeatureFlagKey.isDALEnabled)
		);

		cachedTenant.getOrSet('context', () => createContext(contextParams));
		next();
	};
};
