"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeScenarioFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const user_1 = require("./user");
const initializeScenarioFactory = (context) => {
    const { ScenarioModel } = context.models;
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { name = faker_1.faker.datatype.uuid() } = params;
        const { project, createdBy, wells } = associations;
        onCreate(async (scenario) => {
            const project = scenario.project ?? (await ProjectFactory.create())._id;
            const name = scenario.name ?? faker_1.faker.datatype.uuid();
            return ScenarioModel.create({ ...scenario, project, name });
        });
        afterCreate(async (scenario) => {
            if (!createdBy) {
                scenario.createdBy = (await UserFactory.create())._id;
            }
            return scenario.save();
        });
        return {
            name,
            project,
            createdBy,
            wells,
        };
    });
};
exports.initializeScenarioFactory = initializeScenarioFactory;
