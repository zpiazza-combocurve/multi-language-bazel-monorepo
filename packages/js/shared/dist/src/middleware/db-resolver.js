"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbResolver = void 0;
const database_1 = require("../database");
const dbResolver = () => {
    return async (req, res, next) => {
        const { cachedTenant } = res.locals;
        const info = await cachedTenant.get('info');
        if (!info) {
            // mostly to comply with type checks but in practice this should not happen
            throw new Error('Tenant information not set');
        }
        const { dbConnectionString } = info;
        cachedTenant.getOrSet('connection', () => (0, database_1.connectToDb)(dbConnectionString));
        next();
    };
};
exports.dbResolver = dbResolver;
//# sourceMappingURL=db-resolver.js.map