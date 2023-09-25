"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeProjectFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const user_1 = require("./user");
const initializeProjectFactory = (context) => {
    const { ProjectModel } = context.models;
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { name = faker_1.faker.datatype.uuid() } = params;
        const { createdBy } = associations;
        onCreate((project) => ProjectModel.create(project));
        afterCreate(async (project) => {
            if (!createdBy) {
                project.createdBy = (await UserFactory.create())._id;
            }
            return project.save();
        });
        return {
            name,
            createdBy,
        };
    });
};
exports.initializeProjectFactory = initializeProjectFactory;
