"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeForecastFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const initializeForecastFactory = (context) => {
    const { ForecastModel } = context.models;
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate }) => {
        const { name = faker_1.faker.datatype.uuid(), type } = params;
        const { project } = associations;
        onCreate(async (forecast) => {
            if (!project) {
                forecast.project = (await ProjectFactory.create())._id;
            }
            return ForecastModel.create(forecast);
        });
        return {
            name,
            type,
            project,
        };
    });
};
exports.initializeForecastFactory = initializeForecastFactory;
