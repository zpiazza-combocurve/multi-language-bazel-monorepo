"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeScheduleSettingFactory = exports.resourceFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const activityStepFactory = fishery_1.Factory.define(() => ({
    stepIdx: 0,
    color: '#353769',
    name: faker_1.faker.datatype.uuid(),
    padOperation: 'sequence',
    previousStepIdx: [],
    stepDuration: { days: 15, useLookup: false },
    requiresResources: true,
}));
exports.resourceFactory = fishery_1.Factory.define(() => ({
    active: true,
    availability: { start: 44908, end: 117958 },
    demobilizationDays: 1,
    mobilizationDays: 1,
    workOnHolidays: true,
    name: faker_1.faker.datatype.uuid(),
    stepIdx: [],
}));
const initializeScheduleSettingFactory = (context) => {
    const { ScheduleSettingModel } = context.models;
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { name = faker_1.faker.datatype.uuid() } = params;
        const { project } = associations;
        onCreate((scheduleSetting) => {
            scheduleSetting.activitySteps = activityStepFactory.buildList(1);
            scheduleSetting.resources = exports.resourceFactory.buildList(2, { stepIdx: [0] });
            return ScheduleSettingModel.create(scheduleSetting);
        });
        afterCreate(async (scheduleSetting) => {
            if (!project) {
                scheduleSetting.project = (await ProjectFactory.create())._id;
            }
            return scheduleSetting.save();
        });
        return {
            name,
            project,
        };
    });
};
exports.initializeScheduleSettingFactory = initializeScheduleSettingFactory;
