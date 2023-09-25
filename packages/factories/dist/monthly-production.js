"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMonthlyProductionFactory = void 0;
const fishery_1 = require("fishery");
const well_1 = require("./well");
const initializeMonthlyProductionFactory = (context) => {
    const { MonthlyProductionModel } = context.models;
    const WellFactory = (0, well_1.initializeWellFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { startIndex = 0 } = params;
        const { well, project } = associations;
        onCreate((monthlyProduction) => MonthlyProductionModel.create(monthlyProduction));
        afterCreate(async (monthlyProduction) => {
            if (!well) {
                monthlyProduction.well = (await WellFactory.create())._id;
            }
            if (!project) {
                monthlyProduction.project = monthlyProduction.well.project;
            }
            return monthlyProduction.save();
        });
        return {
            well,
            project,
            startIndex,
            first_production_index: startIndex,
            index: [startIndex, ...new Array(11).fill(null)],
            oil: [1, ...new Array(11).fill(null)],
        };
    });
};
exports.initializeMonthlyProductionFactory = initializeMonthlyProductionFactory;
