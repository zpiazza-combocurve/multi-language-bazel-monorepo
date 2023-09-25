"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeOwnershipQualifierFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const well_1 = require("./well");
const initializeOwnershipQualifierFactory = (context) => {
    const { OwnershipQualifierModel } = context.models;
    const WellFactory = (0, well_1.initializeWellFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate, afterCreate }) => {
        const { qualifierKey, ownership, chosenID, dataSource } = params;
        const { well } = associations;
        onCreate((ownershipQualifier) => OwnershipQualifierModel.create(ownershipQualifier));
        afterCreate(async (ownershipQualifier) => {
            if (!well) {
                ownershipQualifier.well = (await WellFactory.create())._id;
            }
            return ownershipQualifier.save();
        });
        return {
            well,
            chosenID,
            dataSource,
            qualifierKey: qualifierKey ?? 'q0',
            ownership: ownership ?? { name: faker_1.faker.datatype.uuid() },
        };
    });
};
exports.initializeOwnershipQualifierFactory = initializeOwnershipQualifierFactory;
