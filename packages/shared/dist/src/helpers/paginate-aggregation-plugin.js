"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateAggregationPlugin = void 0;
const ASC = 1;
async function paginateAggregation(pipeline, options = {}) {
    const { page = 0, limit = 50, sort = '_id', sortDir = ASC } = options;
    const $limit = Number(limit);
    const $skip = page * $limit;
    const $sort = { [sort]: Number(sortDir) };
    const pagePipeline = [{ $sort }, { $skip }, { $limit }];
    const paginatedPipeline = [
        ...pipeline,
        {
            $facet: {
                total: [{ $count: 'totalItems' }],
                items: pagePipeline,
            },
        },
    ];
    const [{ total, items }] = await this.aggregate(paginatedPipeline).collation({ locale: 'en', strength: 1 });
    const { totalItems } = total[0] || { totalItems: 0 };
    return { totalItems, items, page, $skip, $limit };
}
/** @param {import('mongoose').Schema} schema */
const paginateAggregationPlugin = (schema) => {
    // eslint-disable-next-line no-param-reassign
    schema.statics.paginateAggregation = paginateAggregation;
};
exports.paginateAggregationPlugin = paginateAggregationPlugin;
//# sourceMappingURL=paginate-aggregation-plugin.js.map