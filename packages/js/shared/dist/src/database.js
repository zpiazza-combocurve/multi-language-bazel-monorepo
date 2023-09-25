"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("./config"));
const connectToDb = (dbConnectionString) => Promise.resolve(
// NOTE: take a look at `useDb()` which helps with connection pool sharing
// across multiple databases on the same cluster
mongoose_1.default.createConnection(dbConnectionString, {
    // TODO: autoIndex should be disabled in production once we have the seed scripts for indexes
    autoIndex: config_1.default.devEnv || true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
}));
exports.connectToDb = connectToDb;
//# sourceMappingURL=database.js.map