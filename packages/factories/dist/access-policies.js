"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAccessPolicyFactory = void 0;
const fishery_1 = require("fishery");
const initializeAccessPolicyFactory = (context) => {
    const { AccessPolicyModel } = context.models;
    return fishery_1.Factory.define(({ params, onCreate }) => {
        const { memberId, memberType, resourceType, resourceId, roles } = params;
        onCreate((accessPolicy) => AccessPolicyModel.create(accessPolicy));
        return {
            memberId,
            memberType,
            resourceId,
            resourceType,
            roles,
        };
    });
};
exports.initializeAccessPolicyFactory = initializeAccessPolicyFactory;
