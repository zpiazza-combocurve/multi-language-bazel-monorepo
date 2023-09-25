"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.populate = exports.buildConnectionString = void 0;
const lodash_1 = require("lodash");
const querystring_1 = __importDefault(require("querystring"));
const collections_1 = require("./collections");
const executor_1 = require("./executor");
function buildConnectionString({ username, password, cluster, database, params = null }) {
    const encodedUser = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    const url = `mongodb+srv://${encodedUser}:${encodedPassword}@${cluster}/${database}`;
    if (!params) {
        return url;
    }
    const encodedParams = querystring_1.default.stringify(params);
    return `${url}?${encodedParams}`;
}
exports.buildConnectionString = buildConnectionString;
async function populate(documents, projections, schema, models) {
    /** Similar to mongoose's populate, but can run on plain javascript objects */
    const collectionToModel = Object.values(models).reduce((accumulator, model) => ({ ...accumulator, [model.collection.name]: model }), {});
    const refPaths = Object.keys(projections).filter((path) => (0, lodash_1.get)(schema, path)?.ref);
    const collectedIds = documents.reduce((accumulator, doc) => {
        refPaths.forEach((path) => {
            const collection = (0, lodash_1.get)(schema, path).ref;
            const documentId = (0, lodash_1.get)(doc, path);
            if (documentId) {
                accumulator[collection] = accumulator[collection] || new Set();
                accumulator[collection].add(documentId);
            }
        });
        return accumulator;
    }, {});
    const commands = Object.keys(projections).reduce((accumulator, path) => {
        let select = projections[path];
        if (typeof select !== 'object') {
            return accumulator;
        }
        if (Object.keys(select).length === 0) {
            select = undefined;
        }
        const collection = (0, lodash_1.get)(schema, path)?.ref;
        if (!collection) {
            return accumulator;
        }
        const ids = collectedIds[collection];
        if (!(ids && ids.size)) {
            return accumulator;
        }
        if (accumulator[collection]) {
            return accumulator;
        }
        return {
            ...accumulator,
            [collection]: () => collectionToModel[collection].find({ _id: { $in: [...ids] } }, select),
        };
    }, {});
    const documentsByCollection = await executor_1.Executor.series(commands);
    const collectedModels = (0, lodash_1.mapValues)(documentsByCollection, (docs) => {
        const byId = (0, lodash_1.groupBy)(docs, '_id');
        return (0, lodash_1.mapValues)(byId, ([id]) => id);
    });
    const populated = documents.map((assign) => {
        refPaths.forEach((path) => {
            const collection = (0, lodash_1.get)(schema, path).ref;
            const modelMap = collectedModels[collection];
            const value = (0, lodash_1.get)(assign, path);
            if (modelMap && modelMap[value]) {
                (0, collections_1.set)(assign, path, modelMap[value].toObject());
            }
        });
        return assign;
    });
    return populated;
}
exports.populate = populate;
//# sourceMappingURL=mongo.js.map