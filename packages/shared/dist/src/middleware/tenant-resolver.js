"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantResolver = void 0;
const tenant_cache_1 = require("./tenant-cache");
const tenantResolver = (getRequestTenant, getTenantInfo) => {
    const cache = new tenant_cache_1.TenantCache();
    return (req, res, next) => {
        const tenant = getRequestTenant(req);
        const cachedTenant = cache.getFor(tenant.name);
        cachedTenant.getOrSet('info', () => getTenantInfo(tenant));
        res.locals.cachedTenant = cachedTenant;
        next();
    };
};
exports.tenantResolver = tenantResolver;
//# sourceMappingURL=tenant-resolver.js.map