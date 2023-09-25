import { DAL } from '@combocurve/dal-client';
import { memoize } from 'lodash';

import { LDFeatureFlagKey } from '..';
import { EvaluateFeatureFlag } from './launch-darkly-middleware';
import { ITenantCacheEntry } from './tenant-cache';

export function dalClientResolver() {
	const getDAL = memoize((tenantId: string, dalUrl: string) => DAL.connect(tenantId, { dalUrl }));

	return async (_req, res, next) => {
		const { cachedTenant, evaluateFeatureFlag } = res.locals as {
			cachedTenant: ITenantCacheEntry;
			evaluateFeatureFlag: EvaluateFeatureFlag;
		};

		if (await evaluateFeatureFlag(LDFeatureFlagKey.isDALEnabled)) {
			const info = await cachedTenant.get('info');
			if (!info) {
				// mostly to comply with type checks but in practice this should not happen
				throw new Error('Tenant information not set');
			}
			const { name, dalServerAddress } = info;

			cachedTenant.getOrSet('dalClient', () => getDAL(name, dalServerAddress));
		}

		next();
	};
}
