"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORECAST_TYPES = exports.FORECAST_BASE_PHASES = void 0;
const mongo_1 = require("combocurve-utils/mongo");
exports.FORECAST_BASE_PHASES = mongo_1.schemas.FORECAST_BASE_PHASES;
exports.FORECAST_TYPES = {
    Probabilistic: 'probabilistic',
    Deterministic: 'deterministic',
};
