"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockExpress = void 0;
const mock_express_request_1 = __importDefault(require("mock-express-request"));
const mock_express_response_1 = __importDefault(require("mock-express-response"));
function mockExpress(reqOptions, resOptions) {
    const req = new mock_express_request_1.default(reqOptions);
    const res = new mock_express_response_1.default({ ...resOptions, request: req });
    res.locals = {};
    return { req, res };
}
exports.mockExpress = mockExpress;
//# sourceMappingURL=express-mocks.js.map