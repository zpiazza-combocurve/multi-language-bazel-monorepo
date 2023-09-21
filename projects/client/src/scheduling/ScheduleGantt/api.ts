import { IServerSideGetRowsRequest } from 'ag-grid-community';

import { getApi, postApi } from '@/helpers/routing';

type UpdateRequest = {
	records: {
		tasks: {
			updated: {
				[key: string]: string;
			}[];
		};
	};
};

export function getGanttPaginationInfo(scheduleId: Inpt.ObjectId<'schedule'>) {
	return getApi(`/schedules/${scheduleId}/gantt`);
}

export function getGanttData(
	scheduleId: Inpt.ObjectId<'schedule'>,
	request?: IServerSideGetRowsRequest,
	other?: { nested: boolean }
) {
	return postApi(`/schedules/${scheduleId}/gantt`, { request, ...other });
}

export function getSchedulerData(
	scheduleId: Inpt.ObjectId<'schedule'>,
	request: { startDate: number; endDate: number }
) {
	return postApi(`/schedules/${scheduleId}/scheduler`, { request });
}

export function updateGanttData(scheduleId: Inpt.ObjectId<'schedule'>, request?: UpdateRequest) {
	return postApi(`/schedules/${scheduleId}/gantt/update`, { request });
}

type UpdateSchedulerRequest = {
	startDate: number;
	endDate?: number;
	id: string;
	wellId: string;
	resourceId?: string;
};

export function updateSchedulerData(scheduleId: Inpt.ObjectId<'schedule'>, request?: UpdateSchedulerRequest) {
	return postApi(`/schedules/${scheduleId}/scheduler/update-sync`, { request });
}
