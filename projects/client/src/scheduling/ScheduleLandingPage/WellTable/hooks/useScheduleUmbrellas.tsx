import { useCallback } from 'react';
import { useQuery } from 'react-query';

import { useDerivedState } from '@/components/hooks';
import { getApi } from '@/helpers/routing';

export const useScheduleUmbrellas = (scheduleId: Inpt.ObjectId<'schedule'>) => {
	const { data: apiUmbrellas } = useQuery(
		['schedule', 'umbrellas', { scheduleId }],
		() => getApi(`/schedules/${scheduleId}/qualifier`),
		{ enabled: !!scheduleId, placeholderData: [] }
	);

	const [umbrellas, setUmbrellas] = useDerivedState(apiUmbrellas);

	const addUmbrella = useCallback((umbrella) => setUmbrellas([...umbrellas, umbrella]), [umbrellas, setUmbrellas]);

	return [umbrellas, addUmbrella];
};
