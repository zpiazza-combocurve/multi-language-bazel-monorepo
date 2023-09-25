"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = __importDefault(require("fs"));
const mongodb_memory_server_global_4_2_1 = require("mongodb-memory-server-global-4.2");
const path_1 = __importDefault(require("path"));
const MONGO_CONFIG_PATH = path_1.default.join(__dirname, 'mongoConfig.json');
const mongod = new mongodb_memory_server_global_4_2_1.MongoMemoryServer();
module.exports = async function globalSetup() {
    if (mongod.state !== 'running') {
        await mongod.start();
    }
    const mongoConfig = {
        mongoUri: mongod.getUri('replace-me'),
    };
    fs_1.default.writeFileSync(MONGO_CONFIG_PATH, JSON.stringify(mongoConfig));
    // Set reference to mongod in order to close the server during teardown.
    global.__MONGOD__ = mongod;
};
//# sourceMappingURL=globalSetup.js.map