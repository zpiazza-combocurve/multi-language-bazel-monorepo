"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const base_context_1 = require("../src/base-context");
const database_1 = require("../src/database");
const tenant_1 = require("../src/helpers/tenant");
const express_mocks_1 = require("./express-mocks");
const headers_1 = require("./headers");
const MONGO_CONFIG_PATH = path_1.default.join(__dirname, 'mongoConfig.json');
const localhost = '127.0.0.1';
class TestDbManager {
    context;
    db;
    connection;
    async start() {
        const { mongoUri } = JSON.parse(fs_1.default.readFileSync(MONGO_CONFIG_PATH, 'utf-8'));
        global.__MONGO_URI__ = mongoUri.replace('replace-me', (0, uuid_1.v4)());
        const { req } = (0, express_mocks_1.mockExpress)();
        const headers = (0, headers_1.getTestHeaders)();
        headers.dbConnectionString = global.__MONGO_URI__;
        req.headers = headers;
        this.connection = await (0, database_1.connectToDb)(global.__MONGO_URI__);
        const tenant = await (0, tenant_1.getContextTenantInfoFromHeaders)((0, tenant_1.getRequestTenantFromHeaders)(req));
        this.context = new base_context_1.BaseContext({ tenant, db: this.connection });
        this.db = this.context.db;
    }
    async stop() {
        if (this.db?.host === localhost) {
            await this.db?.dropDatabase();
            await this.db?.close();
            await mongoose_1.default.disconnect();
        }
    }
    async cleanup() {
        if (this.db?.host === localhost) {
            const collections = this?.db?.collections ?? {};
            // eslint-disable-next-line no-restricted-syntax
            for (const collection of Object.values(collections)) {
                // eslint-disable-next-line no-await-in-loop
                await collection.deleteMany({});
            }
        }
    }
}
exports.default = TestDbManager;
//# sourceMappingURL=test-db-manager.js.map