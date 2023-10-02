import { Connection } from 'mongoose';

import logger from '@src/helpers/logger';

import { IBaseContext } from '../base-context';
import { ITenantInfo } from '../tenant';

export interface ITenantCacheData {
	info?: Promise<ITenantInfo>;
	connection?: Promise<Connection>;
	context?: IBaseContext;
	name?: string;
	apiUserId?: string;
}

export interface ITenantCacheEntry {
	get<K extends keyof ITenantCacheData>(key: K): ITenantCacheData[K];

	getOrSet<K extends keyof ITenantCacheData>(
		key: K,
		createValue: () => NonNullable<ITenantCacheData[K]>,
	): NonNullable<ITenantCacheData[K]>;

	delete<K extends keyof ITenantCacheData>(key: K): void;

	set<K extends keyof ITenantCacheData>(key: K, value: NonNullable<ITenantCacheData[K]>): TenantCacheEntry;
}

class TenantCacheEntry implements ITenantCacheEntry {
	constructor(protected data: ITenantCacheData = {}) {}

	get<K extends keyof ITenantCacheData>(key: K): ITenantCacheData[K] {
		return this.data[key];
	}

	getOrSet<K extends keyof ITenantCacheData>(
		key: K,
		createValue: () => NonNullable<ITenantCacheData[K]>,
	): NonNullable<ITenantCacheData[K]> {
		let value = this.data[key];
		if (!value) {
			value = createValue();
			this.data[key] = value;
		}
		return value as NonNullable<ITenantCacheData[K]>;
	}

	set<K extends keyof ITenantCacheData>(key: K, value: NonNullable<ITenantCacheData[K]>): TenantCacheEntry {
		this.data[key] = value;
		return this;
	}

	delete<K extends keyof ITenantCacheData>(key: K): void {
		delete this.data[key];
	}
}

export class TenantCache {
	/**
	 * @example
	 * const cache = new TenantCache()
	 * // ...
	 * const cachedTenant = cache.getFor('<tenant-name>')
	 * // ...
	 * const connectionPromise = cachedTenant.getOrSet('connection', connectToDb())
	 */
	protected cache: Map<string, TenantCacheEntry> = new Map();

	getFor(tenant: string): TenantCacheEntry {
		let cached = this.cache.get(tenant);
		if (!cached) {
			cached = new TenantCacheEntry();
			this.cache.set(tenant, cached);
			logger.info(`Tenant information cached for: ${tenant}`, { tenant });
		}
		return cached;
	}
}
