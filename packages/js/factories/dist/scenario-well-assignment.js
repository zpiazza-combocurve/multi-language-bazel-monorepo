"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeScenarioWellAssignmentFactory = void 0;
const fishery_1 = require("fishery");
const project_1 = require("./project");
const scenario_1 = require("./scenario");
const well_1 = require("./well");
const initializeScenarioWellAssignmentFactory = (context) => {
    const { ScenarioWellAssignmentModel } = context.models;
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    const ScenarioFactory = (0, scenario_1.initializeScenarioFactory)(context);
    const WellFactory = (0, well_1.initializeWellFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { project, scenario, well } = associations;
        onCreate((scenarioWellAssignment) => ScenarioWellAssignmentModel.create(scenarioWellAssignment));
        afterCreate(async (scenarioWellAssignment) => {
            if (!project) {
                scenarioWellAssignment.project = (await ProjectFactory.create())._id;
            }
            if (!scenario) {
                scenarioWellAssignment.scenario = (await ScenarioFactory.create({}, { associations: { project: scenarioWellAssignment.project } }))._id;
            }
            if (!well) {
                scenarioWellAssignment.well = (await WellFactory.create())._id;
            }
            return scenarioWellAssignment.save();
        });
        return {
            capex: params.capex,
            expenses: params.expenses,
            forecast_p_series: params.forecast_p_series,
            reserves_category: params.reserves_category,
            scenario,
            project,
            well,
            index: params.index,
        };
    });
};
exports.initializeScenarioWellAssignmentFactory = initializeScenarioWellAssignmentFactory;
