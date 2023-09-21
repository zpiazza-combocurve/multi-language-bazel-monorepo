/**
 * Socket/Pusher/Task Handling
 *
 * @module
 */
import _ from 'lodash';
import { UseQueryOptions, useQuery } from 'react-query';

import { queryClient } from '@/helpers/query-cache';

import { getApi } from './routing';

export const getFinalEmitter = (emitter: string) => `${emitter}-final`;

export function getSocketName(kind: string, id: string) {
	return `${kind}-${id}`;
}

export function getTaskById(
	taskId: string,
	body: { kind?: string; kindId?: string } = {}
): Promise<Inpt.Task | undefined> {
	return getApi(
		`/task/${taskId}`,
		_.omitBy(body, (v) => !v)
	);
}

export function getTaskByKindId(kindId: string): Promise<Inpt.Task | undefined> {
	return getApi(`/task/get-by-kind-id/${kindId}`);
}

export function taskIsPending(task: Inpt.Task) {
	return task.status === 'pending' || task.status === 'queued';
}

export function getTaskProgress(task: Inpt.Task) {
	return Math.ceil(((task.progress.complete + task.progress.failed) / task.progress.total) * 100);
}

export const TaskQuery = {
	key: (taskId: string) => ['task-by-id', { taskId }],
	useQuery: <T = Inpt.Task | undefined>(
		taskId: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		options?: UseQueryOptions<Inpt.Task | undefined, any, T, any>
	) => useQuery({ ...options, queryKey: TaskQuery.key(taskId), queryFn: () => getTaskById(taskId) }),
	invalidate: (taskId: string) => queryClient.invalidateQueries(TaskQuery.key(taskId)),
};

export const TaskByKindIdQuery = {
	key: (kindId: string) => ['task-by-kind-id', { kindId }],
	useQuery: <T = Inpt.Task | undefined>(
		kindId: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		options?: UseQueryOptions<Inpt.Task | undefined, any, T, any>
	) =>
		useQuery({
			...options,
			queryKey: TaskByKindIdQuery.key(kindId),
			queryFn: () => getTaskByKindId(kindId),
		}),
	invalidate: (kindId: string) => queryClient.invalidateQueries(TaskByKindIdQuery.key(kindId)),
};
