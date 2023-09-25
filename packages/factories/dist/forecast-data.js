"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeForecastDataFactory = void 0;
const fishery_1 = require("fishery");
const forecast_1 = require("./forecast");
const project_1 = require("./project");
const well_1 = require("./well");
const initializeForecastDataFactory = (context) => {
    const { ForecastDataModel } = context.models;
    const ForecastFactory = (0, forecast_1.initializeForecastFactory)(context);
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    const WellFactory = (0, well_1.initializeWellFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate }) => {
        const { status } = params;
        const { project, forecast, well } = associations;
        onCreate(async (forecastData) => {
            if (!project) {
                forecastData.project = (await ProjectFactory.create())._id;
            }
            if (!forecast) {
                forecastData.forecast = (await ForecastFactory.create({}, { associations: { project: forecastData.project } }))._id;
            }
            if (!well) {
                forecastData.well = (await WellFactory.create())._id;
            }
            return ForecastDataModel.create(forecastData);
        });
        return {
            status,
            forecast,
            well,
            project,
        };
    });
};
exports.initializeForecastDataFactory = initializeForecastDataFactory;
