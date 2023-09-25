"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDailyProductionFactory = void 0;
const fishery_1 = require("fishery");
const well_1 = require("./well");
const initializeDailyProductionFactory = (context) => {
    const { DailyProductionModel } = context.models;
    const WellFactory = (0, well_1.initializeWellFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { startIndex = 0 } = params;
        const { well, project } = associations;
        onCreate((dailyProduction) => DailyProductionModel.create(dailyProduction));
        afterCreate(async (dailyProduction) => {
            if (!well) {
                dailyProduction.well = (await WellFactory.create())._id;
            }
            if (!project) {
                dailyProduction.project = dailyProduction.well.project;
            }
            return dailyProduction.save();
        });
        return {
            well,
            project,
            startIndex,
            first_production_index: startIndex,
            index: [startIndex, ...new Array(30).fill(null)],
            oil: [1, ...new Array(30).fill(null)],
        };
    });
};
exports.initializeDailyProductionFactory = initializeDailyProductionFactory;
