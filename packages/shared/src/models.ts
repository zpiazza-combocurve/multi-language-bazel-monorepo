import mongoose from 'mongoose';

import { paginateAggregationPlugin } from './helpers/paginate-aggregation-plugin';

export { registerSharedModels, registerModels } from '@combocurve/mongoose-models';

// Global Plugin
mongoose.plugin(paginateAggregationPlugin);
