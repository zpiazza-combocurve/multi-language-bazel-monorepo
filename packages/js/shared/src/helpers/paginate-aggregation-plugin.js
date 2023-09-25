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

	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	const [{ total, items }] = await this.aggregate(paginatedPipeline).collation({ locale: 'en', strength: 1 });
	const { totalItems } = total[0] || { totalItems: 0 };

	return { totalItems, items, page, $skip, $limit };
}

/** @param {import('mongoose').Schema} schema */
export const paginateAggregationPlugin = (schema) => {
	schema.statics.paginateAggregation = paginateAggregation;
};
