import { useQuery } from 'react-query';

import { getApi } from '@/helpers/routing';

export const useScheduleConstruction = (scheduleId: Inpt.ObjectId<'schedule'>) => {
	return useQuery(['schedule', 'constructions', { scheduleId }], () =>
		getApi(`/schedules/${scheduleId}/constructions/last`)
	);
};
