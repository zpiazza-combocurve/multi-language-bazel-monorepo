"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestHeaders = void 0;
const tenant_1 = require("../src/helpers/tenant");
const getTestHeaders = () => {
    const baseHeader = {};
    for (const [_, value] of Object.entries(tenant_1.TENANT_HEADER_MAPPINGS)) {
        baseHeader[value] = value;
    }
    return baseHeader;
};
exports.getTestHeaders = getTestHeaders;
//# sourceMappingURL=headers.js.map