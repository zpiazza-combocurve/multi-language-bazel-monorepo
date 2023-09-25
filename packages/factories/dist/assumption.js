"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAssumptionFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const initializeAssumptionFactory = (context) => {
    const { AssumptionModel } = context.models;
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { assumptionKey = faker_1.faker.datatype.uuid(), assumptionName = faker_1.faker.datatype.uuid(), econ_function, name = faker_1.faker.datatype.uuid(), unique = false, } = params;
        const { project } = associations;
        onCreate((assumption) => AssumptionModel.create(assumption));
        afterCreate(async (assumption) => {
            if (!assumption) {
                assumption.project = (await ProjectFactory.create())._id;
            }
            return assumption.save();
        });
        return {
            assumptionKey,
            assumptionName,
            econ_function,
            name,
            unique,
            project,
        };
    });
};
exports.initializeAssumptionFactory = initializeAssumptionFactory;
