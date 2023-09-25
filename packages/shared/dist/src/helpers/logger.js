"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.initLogger = exports.logger = void 0;
const logging_winston_1 = require("@google-cloud/logging-winston");
const fast_safe_stringify_1 = __importDefault(require("fast-safe-stringify"));
const triple_beam_1 = require("triple-beam");
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("../config"));
const errors_1 = require("./errors");
const getStackdriverTransport = (logName, serviceContext) => new logging_winston_1.LoggingWinston({
    level: 'debug',
    logName,
    serviceContext: {
        service: serviceContext,
    },
});
// This is the same as winston.format.simple() except the stringified part is formatted in a readable way
// Copied from https://github.com/winstonjs/logform/blob/master/simple.js mostly
const consoleFormat = winston_1.default.format((info) => {
    const stringifiedRest = (0, fast_safe_stringify_1.default)(Object.assign({}, info, {
        level: undefined,
        message: undefined,
        splat: undefined,
    }), undefined, 2);
    const padding = (info.padding && info.padding[info.level]) || '';
    if (stringifiedRest !== '{}') {
        // eslint-disable-next-line no-param-reassign
        info[triple_beam_1.MESSAGE] = `${info.level}:${padding} ${info.message} \n${stringifiedRest}`;
    }
    else {
        // eslint-disable-next-line no-param-reassign
        info[triple_beam_1.MESSAGE] = `${info.level}:${padding} ${info.message}`;
    }
    return info;
})();
exports.logger = winston_1.default.createLogger({
    level: 'debug',
});
const initLogger = (logName, serviceContext) => {
    if (config_1.default.environment !== 'production') {
        exports.logger.add(new winston_1.default.transports.Console({
            format: consoleFormat,
        }));
    }
    else {
        exports.logger.add(getStackdriverTransport(logName, serviceContext));
    }
};
exports.initLogger = initLogger;
const handleError = (error) => {
    const logInfo = (0, errors_1.getLogInfo)(error);
    exports.logger.log(logInfo?.expected ? 'warn' : 'error', logInfo);
};
exports.handleError = handleError;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map