"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.convertIdxToDate = exports.Destroyer = exports.connectToDb = exports.BaseService = exports.BaseContext = exports.getRequestTenantFromHeaders = exports.getContextTenantInfoFromHeaders = exports.logger = exports.initLogger = void 0;
const config_1 = __importDefault(require("./config"));
exports.config = config_1.default;
var logger_1 = require("./helpers/logger");
Object.defineProperty(exports, "initLogger", { enumerable: true, get: function () { return logger_1.initLogger; } });
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
var tenant_1 = require("./helpers/tenant");
Object.defineProperty(exports, "getContextTenantInfoFromHeaders", { enumerable: true, get: function () { return tenant_1.getContextTenantInfoFromHeaders; } });
Object.defineProperty(exports, "getRequestTenantFromHeaders", { enumerable: true, get: function () { return tenant_1.getRequestTenantFromHeaders; } });
var base_context_1 = require("./base-context");
Object.defineProperty(exports, "BaseContext", { enumerable: true, get: function () { return base_context_1.BaseContext; } });
Object.defineProperty(exports, "BaseService", { enumerable: true, get: function () { return base_context_1.BaseService; } });
var database_1 = require("./database");
Object.defineProperty(exports, "connectToDb", { enumerable: true, get: function () { return database_1.connectToDb; } });
var destroyer_1 = require("./helpers/destroyer");
Object.defineProperty(exports, "Destroyer", { enumerable: true, get: function () { return destroyer_1.Destroyer; } });
var utilities_1 = require("./helpers/utilities");
Object.defineProperty(exports, "convertIdxToDate", { enumerable: true, get: function () { return utilities_1.convertIdxToDate; } });
//# sourceMappingURL=index.js.map