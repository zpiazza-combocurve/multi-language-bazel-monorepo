// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const DefaultUserSortingSchema = Schema({
	sortingId: { type: Schema.ObjectId, ref: 'sortings', required: true },
	userId: { type: Schema.ObjectId, ref: 'users', required: true },
});

DefaultUserSortingSchema.index({ sortingId: 1, userId: 1 }, { unique: true });

module.exports = { DefaultUserSortingSchema };
