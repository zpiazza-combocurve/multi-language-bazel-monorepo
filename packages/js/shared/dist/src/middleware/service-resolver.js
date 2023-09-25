"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceResolver = void 0;
const serviceResolver = (ServiceClass, fieldName = 'service') => {
    const createService = (context) => new ServiceClass(context);
    return async (req, res, next) => {
        const { cachedTenant } = res.locals;
        const context = cachedTenant.get('context');
        if (!context) {
            // mostly to comply with type checks but in practice this should not happen
            throw new Error('Context not created');
        }
        const service = createService(context);
        res.locals[fieldName] = service;
        next();
    };
};
exports.serviceResolver = serviceResolver;
//# sourceMappingURL=service-resolver.js.map