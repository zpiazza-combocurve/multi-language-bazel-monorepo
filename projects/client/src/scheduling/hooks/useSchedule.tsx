import { useCallback } from 'react';

import { invalidateSchedule, useScheduleQuery } from '@/scheduling/shared';

export const useSchedule = (scheduleId: Inpt.ObjectId<'schedule'>) => {
	const scheduleQuery = useScheduleQuery(scheduleId);

	const reload = useCallback(() => invalidateSchedule(scheduleId), [scheduleId]);

	return {
		schedule: scheduleQuery.data,
		reload,
		loading: scheduleQuery.isLoading,
	};
};
