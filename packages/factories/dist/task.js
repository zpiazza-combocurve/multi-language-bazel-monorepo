"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTaskFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const initializeTaskFactory = (context) => {
    const { TaskModel } = context.models;
    return fishery_1.Factory.define(({ params, onCreate }) => {
        const { _id, batchCount = 1, createdAt = Date.now(), kind = 'forecast', kindId = faker_1.faker.database.mongodbObjectId(), queueName, status = 'queued', title = 'Test task', user = faker_1.faker.database.mongodbObjectId(), } = params;
        onCreate((task) => TaskModel.create(task));
        return {
            _id,
            aborted: 0,
            batches: [],
            body: {},
            cleanUp: null,
            cleanUpAt: null,
            finishedAt: null,
            createdAt,
            description: 'Generic task description',
            error: null,
            kind,
            kindId,
            mostRecentEnd: null,
            mostRecentStart: null,
            pendingAt: null,
            queueName,
            status,
            supervisorJobName: null,
            title,
            user,
            progress: {
                channel: {
                    type: 'company',
                    tenant: 'test',
                    user_id: null,
                },
                complete: 0,
                denom: 1,
                emitter: 'foo',
                failed: 0,
                total: batchCount,
            },
        };
    });
};
exports.initializeTaskFactory = initializeTaskFactory;
