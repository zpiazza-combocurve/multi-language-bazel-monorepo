"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initClient = exports.inferFieldMask = exports.buildFieldMask = void 0;
const nice_grpc_1 = require("nice-grpc");
const daily_production_1 = require("./gen/combocurve/dal/v1/daily_production");
const monthly_production_1 = require("./gen/combocurve/dal/v1/monthly_production");
var field_mask_helper_1 = require("./field-mask-helper");
Object.defineProperty(exports, "buildFieldMask", { enumerable: true, get: function () { return field_mask_helper_1.buildFieldMask; } });
Object.defineProperty(exports, "inferFieldMask", { enumerable: true, get: function () { return field_mask_helper_1.inferFieldMask; } });
async function initClient(config) {
    const channel = (0, nice_grpc_1.createChannel)(config.dalUrl);
    const sharedConfig = { metadata: (0, nice_grpc_1.Metadata)({ 'tenant-id': config.tenantId }) };
    const initService = (service) => (0, nice_grpc_1.createClient)(service, channel, { '*': sharedConfig });
    return {
        dailyProduction: initService(daily_production_1.DailyProductionServiceDefinition),
        monthlyProduction: initService(monthly_production_1.MonthlyProductionServiceDefinition),
    };
}
exports.initClient = initClient;
