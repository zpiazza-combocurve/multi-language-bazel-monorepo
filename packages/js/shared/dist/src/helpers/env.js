"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvs = exports.getEnv = void 0;
const getEnv = (name) => {
    const env = process.env[name];
    if (!env) {
        throw new Error(`Missing env variable ${name}`);
    }
    return env;
};
exports.getEnv = getEnv;
const getEnvs = (names) => {
    return names.reduce((acc, name) => {
        acc[name] = getEnv(name);
        return acc;
    }, {});
};
exports.getEnvs = getEnvs;
//# sourceMappingURL=env.js.map