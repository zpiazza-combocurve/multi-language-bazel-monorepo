// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { TASK_STATUS } = require('./constants/task-status');

const TASK_DEFAULT_CALL_STATE = { processed: 0, start: null, end: null };

const CallState = { processed: Number, start: Date, end: Date };

// eslint-disable-next-line new-cap -- TODO eslint fix later
const TaskSchema = Schema(
	{
		aborted: { type: Number },
		batches: [CallState],
		body: {},
		canceledAt: { type: Date }, // time at which the task was canceled
		cleanUp: CallState,
		cleanUpAt: { type: Date }, // time at which the clean up phase was requested
		dependency: { type: ObjectId, ref: 'tasks' }, // optional: ID of the task this task depends on
		description: { type: String, default: '' },
		error: { type: String, default: null },
		finishedAt: { type: Date }, // time at which the task finished, in either `complete` or `failed` status
		kind: {
			// should match cloud function name
			type: String,
			enum: [
				'cc-cc-import',
				'collision-report',
				'diagnostics',
				'directional-survey-export',
				'econ-report-by-well',
				'econ-well-calcs',
				'economics_file',
				'economics',
				'file_upload',
				'file-import',
				'forecast-charts-export',
				'forecast-convert-type',
				'forecast-export',
				'forecast',
				'libForecast',
				'production-data-export',
				'proximity-forecast',
				'remove-leading-zeros',
				'rollUp',
				'well-calcs',
				'export-wells',
			],
		},
		kindId: { type: ObjectId, required: true },
		mostRecentEnd: { type: Date },
		mostRecentStart: { type: Date },
		pendingAt: { type: Date }, // time at which the task entered the pending status
		progress: {
			channel: { type: Object, required: true }, // info required to determine the notification channel for this task
			complete: { type: Number, default: 0 }, // number of successful tasks
			denom: { type: Number, default: 1 }, // number of tasks that need to be completed (successful + failed) before pushing progress to the user
			emitter: { type: String, required: true }, // emitter name to push progress
			failed: { type: Number, default: 0 }, // number of tasks that have failed
			total: { type: Number, required: true }, // total number of tasks
			initial: { type: Number, default: 0 }, // initial % progress to use for the task
			end: { type: Number, default: 100 }, // end % progress to use for the task
		},
		queueName: { type: String }, // The name of the Cloud Tasks queue used to run this task
		status: {
			type: String,
			enum: Object.values(TASK_STATUS),
			required: true,
		},
		supervisorJobName: { type: String },
		title: { type: String, required: true },
		user: { type: ObjectId, ref: 'users', index: true },
	},
	{ timestamps: true }
);

const FINISHED_TASK_EXPIRATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

TaskSchema.index({ kind: 1, status: 1 });

// documents for finished and canceled task will expire
TaskSchema.index({ finishedAt: 1 }, { expireAfterSeconds: FINISHED_TASK_EXPIRATION_SECONDS });
TaskSchema.index({ canceledAt: 1 }, { expireAfterSeconds: FINISHED_TASK_EXPIRATION_SECONDS });

// add virtuals
TaskSchema.virtual('getProgress').get(function prog() {
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	const { complete, failed, total } = this.progress;
	return Math.ceil((complete + failed) / total);
});

module.exports = { TaskSchema, TASK_DEFAULT_CALL_STATE, TASK_STATUS };
