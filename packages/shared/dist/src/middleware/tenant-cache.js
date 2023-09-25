"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantCache = void 0;
class TenantCacheEntry {
    data;
    constructor() {
        this.data = { expirationTime: Date.now() + 60 * 60 * 1000 };
    }
    get(key) {
        return this.data[key];
    }
    getOrSet(key, createValue) {
        let value = this.data[key];
        if (!value) {
            value = createValue();
            this.data[key] = value;
        }
        return value;
    }
    set(key, value) {
        this.data[key] = value;
        return this;
    }
}
class TenantCache {
    /**
     * @example
     * 	const cache = new TenantCache();
     * 	// ...
     * 	const cachedTenant = cache.getFor('<tenant-name>');
     * 	// ...
     * 	const connectionPromise = cachedTenant.getOrSet('connection', connectToDb());
     */
    cache = new Map();
    getFor(tenant) {
        let cached = this.cache.get(tenant);
        if (!cached || Date.now() >= cached.get('expirationTime')) {
            cached = new TenantCacheEntry();
            this.cache.set(tenant, cached);
        }
        return cached;
    }
}
exports.TenantCache = TenantCache;
//# sourceMappingURL=tenant-cache.js.map