import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeTaskFactory = (context: any) => {
	const { TaskModel } = context.models;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, onCreate }) => {
		const {
			_id,
			batchCount = 1,
			createdAt = Date.now(),
			kind = 'forecast',
			kindId = faker.database.mongodbObjectId(),
			queueName,
			status = 'queued',
			title = 'Test task',
			user = faker.database.mongodbObjectId(),
		} = params;

		onCreate((task) => TaskModel.create(task));

		return {
			_id,
			aborted: 0,
			batches: [],
			body: {},
			cleanUp: null,
			cleanUpAt: null,
			finishedAt: null,
			createdAt,
			description: 'Generic task description',
			error: null,
			kind,
			kindId,
			mostRecentEnd: null,
			mostRecentStart: null,
			pendingAt: null,
			queueName,
			status,
			supervisorJobName: null,
			title,
			user,
			progress: {
				channel: {
					type: 'company',
					tenant: 'test',
					user_id: null,
				},
				complete: 0,
				denom: 1,
				emitter: 'foo',
				failed: 0,
				total: batchCount,
			},
		};
	});
};
