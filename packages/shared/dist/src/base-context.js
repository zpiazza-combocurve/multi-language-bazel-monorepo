"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = exports.BaseContext = void 0;
const models_1 = require("./models");
class BaseContext {
    constructor({ tenant, db }) {
        this.db = db;
        this.tenant = tenant;
        this.models = (0, models_1.registerModels)(db);
    }
    db;
    models;
    tenant;
}
exports.BaseContext = BaseContext;
class BaseService {
    static attribute;
    context;
    constructor(context) {
        this.context = context;
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=base-context.js.map