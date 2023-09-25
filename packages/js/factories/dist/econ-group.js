"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeEconGroupFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const scenario_1 = require("./scenario");
const user_1 = require("./user");
const initializeEconGroupFactory = (context) => {
    const { EconGroupModel } = context.models;
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    const ScenarioFactory = (0, scenario_1.initializeScenarioFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate }) => {
        const { name = faker_1.faker.datatype.uuid() } = params;
        const { createdBy, project, scenario, assignments } = associations;
        onCreate(async (econGroup) => {
            const project = econGroup.project ?? (await ProjectFactory.create())._id;
            const scenario = econGroup.scenario ?? (await ScenarioFactory.create({}, { associations: { project } }))._id;
            const name = econGroup.name ?? faker_1.faker.datatype.uuid();
            const createdBy = econGroup.createdBy ?? (await UserFactory.create())._id;
            return EconGroupModel.create({ ...econGroup, project, scenario, name, createdBy });
        });
        return {
            name,
            createdBy,
            project,
            scenario,
            assignments,
        };
    });
};
exports.initializeEconGroupFactory = initializeEconGroupFactory;
