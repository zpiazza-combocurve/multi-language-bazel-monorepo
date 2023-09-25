"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const teardown = async () => {
    await global.__MONGOD__.stop();
};
exports.default = teardown;
//# sourceMappingURL=globalTeardown.js.map