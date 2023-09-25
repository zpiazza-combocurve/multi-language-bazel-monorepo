"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeEconGroupConfigurationFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const user_1 = require("./user");
const initializeEconGroupConfigurationFactory = (context) => {
    const { EconGroupConfigurationModel } = context.models;
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { name = faker_1.faker.datatype.uuid() } = params;
        const { createdBy } = associations;
        onCreate((config) => EconGroupConfigurationModel.create(config));
        afterCreate(async (config) => {
            if (!createdBy) {
                config.createdBy = (await UserFactory.create())._id;
            }
            return config.save();
        });
        return {
            name,
            configuration: {
                headers: [faker_1.faker.database.column()],
                groupName: faker_1.faker.lorem.word(),
                massCreateGroups: faker_1.faker.datatype.boolean(),
                headerAsName: faker_1.faker.datatype.boolean(),
            },
            properties: {
                econLimit: faker_1.faker.lorem.word(),
                allocation: {
                    timing: faker_1.faker.lorem.word(),
                    properties: faker_1.faker.lorem.word(),
                    basis: faker_1.faker.lorem.word(),
                    method: faker_1.faker.lorem.word(),
                    methodType: faker_1.faker.lorem.word(),
                },
                exclusion: {
                    volumnOptions: faker_1.faker.lorem.word(),
                    group: faker_1.faker.lorem.word(),
                },
            },
        };
    });
};
exports.initializeEconGroupConfigurationFactory = initializeEconGroupConfigurationFactory;
