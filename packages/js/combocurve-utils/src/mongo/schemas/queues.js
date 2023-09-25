// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const QueueSchema = Schema({
	assigned: { type: Boolean, required: true }, // indicates whether the queue is currently assigned or not
	kind: String, // a label indicating which configuration was applied to this queue, initially empty
	lastAssignedAt: Date, // date and time this queue was last assigned, initially empty
	lastAssignedTo: String, // tenant the queue was last assigned to, initially empty
	name: { type: String, required: true }, // unique name for this queue
});

// used when finding a queue to assign: `assigned` is included in all queries, and `kind` sometimes
QueueSchema.index({ assigned: 1, kind: 1 });

// used when updating a specific queue to unassign it
QueueSchema.index({ name: 1 }, { unique: true });

module.exports = { QueueSchema };
