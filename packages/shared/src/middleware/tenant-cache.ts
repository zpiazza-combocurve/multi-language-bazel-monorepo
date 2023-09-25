import { IDAL } from '@combocurve/dal-client';
import { Connection } from 'mongoose';

import { BaseContext } from '../base-context';
import { IBaseTenantInfo } from '../helpers/tenant';

export interface ITenantCacheData {
	expirationTime?: number;
	info?: Promise<IBaseTenantInfo>;
	connection?: Promise<Connection>;
	context?: BaseContext;
	dalClient?: IDAL;
}

export interface ITenantCacheEntry<T extends ITenantCacheData = ITenantCacheData> {
	get<K extends keyof T>(key: K): T[K];

	getOrSet<K extends keyof T>(key: K, createValue: () => NonNullable<T[K]>): NonNullable<T[K]>;
}

class TenantCacheEntry<T extends ITenantCacheData> implements ITenantCacheEntry<T> {
	protected data: T;

	constructor() {
		this.data = { expirationTime: Date.now() + 60 * 60 * 1000 } as T;
	}

	get<K extends keyof T>(key: K): T[K] {
		return this.data[key];
	}

	getOrSet<K extends keyof T>(key: K, createValue: () => NonNullable<T[K]>): NonNullable<T[K]> {
		let value = this.data[key];
		if (!value) {
			value = createValue();
			this.data[key] = value;
		}
		return value as NonNullable<T[K]>;
	}

	set<K extends keyof T>(key: K, value: NonNullable<T[K]>): TenantCacheEntry<T> {
		this.data[key] = value;
		return this;
	}
}

export class TenantCache<T extends ITenantCacheData = ITenantCacheData> {
	/**
	 * @example
	 * 	const cache = new TenantCache();
	 * 	// ...
	 * 	const cachedTenant = cache.getFor('<tenant-name>');
	 * 	// ...
	 * 	const connectionPromise = cachedTenant.getOrSet('connection', connectToDb());
	 */
	protected cache: Map<string, TenantCacheEntry<T>> = new Map();

	getFor(tenant: string): TenantCacheEntry<T> {
		let cached = this.cache.get(tenant);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		if (!cached || Date.now() >= cached.get('expirationTime')!) {
			cached = new TenantCacheEntry<T>();
			this.cache.set(tenant, cached);
		}
		return cached;
	}
}
