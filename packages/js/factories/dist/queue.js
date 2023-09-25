"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeQueueFactory = void 0;
const fishery_1 = require("fishery");
const initializeQueueFactory = (context) => {
    const { QueueModel } = context.sharedModels;
    return fishery_1.Factory.define(({ params, onCreate }) => {
        const { assigned = false, kind, name } = params;
        onCreate((queue) => QueueModel.create(queue));
        return {
            assigned,
            kind,
            name,
        };
    });
};
exports.initializeQueueFactory = initializeQueueFactory;
