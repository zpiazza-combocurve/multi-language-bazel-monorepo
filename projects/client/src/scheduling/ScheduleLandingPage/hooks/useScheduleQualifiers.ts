import { useCallback } from 'react';

import { withLoadingBar } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';

import { useScheduleUmbrellas } from '../WellTable/hooks/useScheduleUmbrellas';

export const useScheduleQualifiers = ({ projectId, scheduleId, updateAssignments, reloadSchedule }) => {
	const [qualifiers, addQualifiers] = useScheduleUmbrellas(scheduleId);

	const updateQualifier = useCallback(
		(qualifierId) => {
			withLoadingBar(
				postApi(`/schedules/${scheduleId}/qualifier/update`, {
					qualifierId,
				}).then(() => {
					updateAssignments(undefined, ['scheduling_status']);
					reloadSchedule();
				})
			);
		},
		[scheduleId, updateAssignments, reloadSchedule]
	);

	const createQualifier = useCallback(
		({ column, name }) => {
			withLoadingBar(
				postApi(`/schedules/${scheduleId}/qualifier/create`, {
					column,
					name,
					projectId,
				}).then((created) => {
					addQualifiers(created);
					updateAssignments(undefined, ['scheduling_status']);
					reloadSchedule();
				})
			);
		},
		[scheduleId, projectId, addQualifiers, updateAssignments, reloadSchedule]
	);

	return { qualifiers, createQualifier, updateQualifier };
};
