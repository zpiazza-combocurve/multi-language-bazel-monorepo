"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestDbManager = void 0;
const globals_1 = require("@jest/globals");
const test_db_manager_1 = __importDefault(require("./test-db-manager"));
function setupTestDbManager() {
    const testDbManager = new test_db_manager_1.default();
    (0, globals_1.beforeAll)(() => testDbManager.start());
    (0, globals_1.afterEach)(() => testDbManager.cleanup());
    (0, globals_1.afterAll)(() => testDbManager.stop());
    return testDbManager;
}
exports.setupTestDbManager = setupTestDbManager;
//# sourceMappingURL=test-helper.js.map