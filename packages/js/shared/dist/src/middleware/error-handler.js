"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = exports.uncaughtRejectionHandler = exports.uncaughtExceptionHandler = void 0;
const errors_1 = require("../helpers/errors");
const logger_1 = __importDefault(require("../helpers/logger"));
const GENERIC_ERROR_MESSAGE = 'An error occurred, check log metadata for details';
const BAD_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;
const uncaughtExceptionHandler = (error, req, res, next) => {
    const message = error?.message ?? GENERIC_ERROR_MESSAGE;
    logger_1.default.error(`Uncaught exception: ${message}`, (0, errors_1.getLogInfo)(error));
};
exports.uncaughtExceptionHandler = uncaughtExceptionHandler;
const uncaughtRejectionHandler = (error, req, res, next) => {
    const message = error?.message ?? GENERIC_ERROR_MESSAGE;
    logger_1.default.error(`Unhandled promise rejection: ${message}`, (0, errors_1.getLogInfo)(error));
};
exports.uncaughtRejectionHandler = uncaughtRejectionHandler;
const errorHandlerMiddleware = () => {
    return function (error, req, res, next) {
        const message = error?.message ?? JSON.stringify((0, errors_1.getClientInfo)(error));
        res.status(INTERNAL_SERVER_ERROR).send(message);
        logger_1.default.error('error', (0, errors_1.getLogInfo)(error));
    };
};
exports.errorHandlerMiddleware = errorHandlerMiddleware;
//# sourceMappingURL=error-handler.js.map