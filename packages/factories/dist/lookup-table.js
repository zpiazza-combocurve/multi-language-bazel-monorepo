"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeLookupTableFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const user_1 = require("./user");
const initializeLookupTableFactory = (context) => {
    const { LookupTableModel } = context.models;
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    return fishery_1.Factory.define(({ sequence, associations, onCreate }) => {
        const { project, createdBy } = associations;
        onCreate(async (lookupTable) => {
            if (!createdBy) {
                lookupTable.createdBy = (await UserFactory.create())._id;
            }
            if (!project) {
                lookupTable.project = (await ProjectFactory.create({}, { associations: { createdBy: lookupTable.createdBy } }))._id;
            }
            return LookupTableModel.create(lookupTable);
        });
        return {
            name: `${faker_1.faker.lorem.word()}_${sequence}`,
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
exports.initializeLookupTableFactory = initializeLookupTableFactory;
