"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeShareableCodeFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const project_1 = require("./project");
const user_1 = require("./user");
const initializeShareableCodeFactory = (context) => {
    const { ShareableCodeModel } = context.sharedModels;
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    const ProjectFactory = (0, project_1.initializeProjectFactory)(context);
    return fishery_1.Factory.define(({ params, associations, onCreate }) => {
        const { expireAt, code = faker_1.faker.datatype.uuid(), tenant = 'local', enabled = true } = params;
        const { project, user } = associations;
        onCreate(async (shareableCode) => {
            if (!project) {
                shareableCode.project = (await ProjectFactory.create())._id;
            }
            if (!user) {
                const newUser = await UserFactory.create();
                shareableCode.user = {
                    _id: newUser._id,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                };
            }
            return ShareableCodeModel.create(shareableCode);
        });
        return {
            tenant,
            code,
            enabled,
            project,
            expireAt,
            user,
        };
    });
};
exports.initializeShareableCodeFactory = initializeShareableCodeFactory;
