"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeEconComboSettingFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const scenario_1 = require("./scenario");
const user_1 = require("./user");
const initializeEconComboSettingFactory = (context) => {
    const { EconComboSettingModel } = context.models;
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    const ScenarioFactory = (0, scenario_1.initializeScenarioFactory)(context);
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    return fishery_1.Factory.define(({ sequence, associations, onCreate, afterCreate }) => {
        const { project, scenario, createdBy } = associations;
        onCreate((econComboSetting) => EconComboSettingModel.create(econComboSetting));
        afterCreate(async (econComboSetting) => {
            if (!project) {
                econComboSetting.project = (await ProjectFactory.create({}, { associations: { createdBy } }))._id;
            }
            if (!scenario) {
                econComboSetting.scenario = (await ScenarioFactory.create({}, { associations: { createdBy } }))._id;
            }
            if (!createdBy) {
                econComboSetting.createdBy = (await UserFactory.create())._id;
            }
            return econComboSetting.save();
        });
        return {
            name: `${faker_1.faker.lorem.word()}_${sequence}`,
            project,
            scenario,
            createdBy,
            combos: [],
        };
    });
};
exports.initializeEconComboSettingFactory = initializeEconComboSettingFactory;
