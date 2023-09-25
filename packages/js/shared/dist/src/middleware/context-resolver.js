"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextResolver = exports.getBaseContextParams = void 0;
const getBaseContextParams = async (cachedTenant) => {
    const [info, connection] = await Promise.all([cachedTenant.get('info'), cachedTenant.get('connection')]);
    if (!info) {
        // mostly to comply with type checks but in practice this should not happen
        throw new Error('Tenant information not set');
    }
    if (!connection) {
        // mostly to comply with type checks but in practice this should not happen
        throw new Error('DB connection not established');
    }
    return { db: connection, tenant: info };
};
exports.getBaseContextParams = getBaseContextParams;
const contextResolver = (ContextClass, getContextParams) => {
    const createContext = (params) => new ContextClass(params);
    return async (req, res, next) => {
        const { cachedTenant } = res.locals;
        const contextParams = await getContextParams(cachedTenant);
        cachedTenant.getOrSet('context', () => createContext(contextParams));
        next();
    };
};
exports.contextResolver = contextResolver;
//# sourceMappingURL=context-resolver.js.map