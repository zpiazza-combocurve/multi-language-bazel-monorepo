import { Connection } from 'mongoose';
import { BaseContext } from '../base-context';
import { IBaseTenantInfo } from '../helpers/tenant';
export interface ITenantCacheData {
    expirationTime?: number;
    info?: Promise<IBaseTenantInfo>;
    connection?: Promise<Connection>;
    context?: BaseContext;
}
export interface ITenantCacheEntry<T extends ITenantCacheData = ITenantCacheData> {
    get<K extends keyof T>(key: K): T[K];
    getOrSet<K extends keyof T>(key: K, createValue: () => NonNullable<T[K]>): NonNullable<T[K]>;
}
declare class TenantCacheEntry<T extends ITenantCacheData> implements ITenantCacheEntry<T> {
    protected data: T;
    constructor();
    get<K extends keyof T>(key: K): T[K];
    getOrSet<K extends keyof T>(key: K, createValue: () => NonNullable<T[K]>): NonNullable<T[K]>;
    set<K extends keyof T>(key: K, value: NonNullable<T[K]>): TenantCacheEntry<T>;
}
export declare class TenantCache<T extends ITenantCacheData = ITenantCacheData> {
    /**
     * @example
     * 	const cache = new TenantCache();
     * 	// ...
     * 	const cachedTenant = cache.getFor('<tenant-name>');
     * 	// ...
     * 	const connectionPromise = cachedTenant.getOrSet('connection', connectToDb());
     */
    protected cache: Map<string, TenantCacheEntry<T>>;
    getFor(tenant: string): TenantCacheEntry<T>;
}
export {};
//# sourceMappingURL=tenant-cache.d.ts.map