"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUserFactory = void 0;
const faker_1 = require("@faker-js/faker");
const fishery_1 = require("fishery");
const access_policies_1 = require("./access-policies");
const initializeUserFactory = (context) => {
    const { UserModel } = context.models;
    const AccessPolicyFactory = (0, access_policies_1.initializeAccessPolicyFactory)(context);
    return fishery_1.Factory.define(({ params, transientParams, onCreate, afterCreate }) => {
        const { auth0Id = `test-auth0-id-${faker_1.faker.datatype.uuid()}`, email = `test_${faker_1.faker.datatype.uuid()}@combocurve.com`.toLowerCase(), firstName = faker_1.faker.name.firstName(), lastName = faker_1.faker.name.lastName(), } = params;
        const { companyAdmin, companyProjectViewer } = transientParams;
        onCreate((user) => UserModel.create(user));
        if (companyAdmin) {
            afterCreate(async (user) => {
                await AccessPolicyFactory.create({
                    memberId: user._id,
                    memberType: 'users',
                    resourceType: 'company',
                    roles: 'company.admin',
                });
                return user;
            });
        }
        if (companyProjectViewer) {
            afterCreate(async (user) => {
                await AccessPolicyFactory.create({
                    memberId: user._id,
                    memberType: 'users',
                    resourceType: 'company',
                    roles: 'company.project.viewer',
                });
                return user;
            });
        }
        return {
            auth0Id,
            email,
            firstName,
            lastName,
        };
    });
};
exports.initializeUserFactory = initializeUserFactory;
