"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeScheduleFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const initializeScheduleFactory = (context) => {
    const { ScheduleModel } = context.models;
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { name = faker_1.faker.datatype.uuid(), method = 'auto' } = params;
        const { project } = associations;
        onCreate((schedule) => ScheduleModel.create(schedule));
        afterCreate(async (schedule) => {
            if (!project) {
                schedule.project = (await ProjectFactory.create())._id;
            }
            return schedule.save();
        });
        return {
            name,
            method,
            project,
        };
    });
};
exports.initializeScheduleFactory = initializeScheduleFactory;
