"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeForecastLookupTableFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const user_1 = require("./user");
const initializeForecastLookupTableFactory = (context) => {
    const { ForecastLookupTableModel } = context.models;
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    return fishery_1.Factory.define(({ sequence, associations, onCreate, afterCreate }) => {
        const { project, createdBy } = associations;
        onCreate((forecastLookupTable) => ForecastLookupTableModel.create(forecastLookupTable));
        afterCreate(async (forecastLookupTable) => {
            if (!project) {
                forecastLookupTable.project = (await ProjectFactory.create({}, { associations: { createdBy } }))._id;
            }
            if (!createdBy) {
                forecastLookupTable.createdBy = (await UserFactory.create())._id;
            }
            return forecastLookupTable.save();
        });
        return {
            name: `forecast-${faker_1.faker.lorem.word()}-${sequence}`,
            project,
            createdBy,
            rules: [
                {
                    filter: {
                        conditions: [
                            {
                                key: 'perf_lateral_length',
                                operator: 'equal',
                                value: 100,
                            },
                        ],
                    },
                },
            ],
        };
    });
};
exports.initializeForecastLookupTableFactory = initializeForecastLookupTableFactory;
