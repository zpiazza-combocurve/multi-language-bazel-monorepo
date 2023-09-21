import { useQuery } from 'react-query';

import { queryClient as globalQueryClient } from '@/helpers/query-cache';
import { getApi } from '@/helpers/routing';

export function useScheduleQuery(scheduleId: Inpt.ObjectId<'schedule'>) {
	return useQuery(
		['schedule', 'view', { scheduleId }],
		() => getApi(`/schedules/${scheduleId}`) as Promise<Inpt.Schedule>
	);
}

export function invalidateSchedule(scheduleId: Inpt.ObjectId<'schedule'>, { queryClient = globalQueryClient } = {}) {
	queryClient.invalidateQueries(['schedule', 'view', { scheduleId }]);
}
