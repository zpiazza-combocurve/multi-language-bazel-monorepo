"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGroupFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const user_1 = require("./user");
const initializeGroupFactory = (context) => {
    const { GroupModel } = context.models;
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate }) => {
        const { name = faker_1.faker.datatype.uuid(), description = faker_1.faker.lorem.sentence(10), users = [] } = params;
        const { createdBy } = associations;
        onCreate(async (group) => {
            if (!createdBy) {
                group.createdBy = (await UserFactory.create())._id;
            }
            return GroupModel.create(group);
        });
        return {
            name,
            description,
            users,
        };
    });
};
exports.initializeGroupFactory = initializeGroupFactory;
