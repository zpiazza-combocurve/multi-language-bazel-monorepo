export const TASK_STATUS = {
	AWAITING_DEPENDENCY: 'awaiting_dependency', // Tasks with a dependency will start in this state instead of `queued`, and will stay in this until the dependency task finishes.
	CANCELED: 'canceled', // For when a task is killed before starting. If a task depends on another task that fails, it be moved to canceled and it will never reach `queued` or any other states.
	QUEUED: 'queued', // A task that is ready to be run as soon as there is availability.
	RUNNING: 'pending', // The task is running.
	COMPLETED: 'complete', // The task finished successfully.
	FAILED: 'failed', // The task finished unsuccessfully.
};
