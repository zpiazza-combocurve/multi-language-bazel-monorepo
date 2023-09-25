"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWellFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const initializeWellFactory = (context) => {
    const { WellModel } = context.models;
    return fishery_1.Factory.define(({ params, associations, onCreate }) => {
        const { well_name = faker_1.faker.datatype.uuid(), dataSource, chosenID, closest_well_any_zone, closest_well_same_zone, api14, } = params;
        const { project } = associations;
        onCreate((well) => WellModel.create(well));
        return {
            well_name,
            dataSource,
            chosenID,
            closest_well_any_zone,
            closest_well_same_zone,
            project,
            api14,
        };
    });
};
exports.initializeWellFactory = initializeWellFactory;
