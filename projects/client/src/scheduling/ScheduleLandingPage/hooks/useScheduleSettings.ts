import { useState } from 'react';

import { useAlfa } from '@/helpers/alfa';
import { useCreate, useDelete, useSave, useSelect } from '@/scheduling/ScheduleLandingPage/Settings/requests/mutations';
import {
	useGetProjects,
	useGetSetting,
	useGetSettingsByProject,
} from '@/scheduling/ScheduleLandingPage/Settings/requests/queries';

export type ScheduleSettings = {
	currentSettingId?: Inpt.ObjectId;
	projectId: Inpt.ObjectId;
	scheduleId: Inpt.ObjectId;
};

export const compareMatch = (a: Inpt.ObjectId, b: Inpt.ObjectId, actual: Inpt.ObjectId) => {
	if (actual === undefined || actual === null) {
		return 0;
	}
	if (a === actual && b === actual) {
		return 0;
	}
	if (a === actual) {
		return -1;
	}
	if (b === actual) {
		return 1;
	}
	return 0;
};

export const useScheduleSettings = ({ currentSettingId, projectId, scheduleId }: ScheduleSettings) => {
	const {
		user: { _id: userId },
	} = useAlfa();

	const [getSettingsVariables, setGetSettingsVariables] = useState({ projectId });

	const {
		isLoading: settingLoading,
		data: settingData,
		refetch: refetchSetting,
	} = useGetSetting(
		{ currentSettingId },
		{
			enabled: !!currentSettingId,
		}
	);

	const {
		isLoading: gettingSettingsByProject,
		data: settingsByProjectData,
		refetch: refetchSettingsByProject,
	} = useGetSettingsByProject(getSettingsVariables, { enabled: !!projectId });

	const { isLoading: gettingProjects, data: projectsData } = useGetProjects(
		{ feature: 'scheduling/settings' },
		{
			select: (data) =>
				data
					.sort(
						(a, b) =>
							compareMatch(a?.createdBy?._id, b?.createdBy?._id, userId) * 10 +
							compareMatch(a?._id, b?._id, projectId)
					)
					.filter(({ 'scheduling/settings': count }) => count > 0)
					.map((item) => item),
		}
	);

	const { isLoading: saving, mutateAsync: saveSetting } = useSave(currentSettingId);
	const { isLoading: creating, mutateAsync: createSetting } = useCreate();
	const { isLoading: deleting, mutateAsync: deleteSetting } = useDelete();
	const { isLoading: selecting, mutateAsync: selectSetting } = useSelect(scheduleId);

	const loading = settingLoading || gettingSettingsByProject || gettingProjects;
	const updating = saving || creating || selecting || deleting;

	return {
		settingData,
		settingsByProjectData,
		projectsData,

		loading,
		updating,

		saveSetting,
		createSetting,
		deleteSetting,
		selectSetting,
		refetchSetting,

		setGetSettingsVariables,
		refetchSettingsByProject,
	};
};
