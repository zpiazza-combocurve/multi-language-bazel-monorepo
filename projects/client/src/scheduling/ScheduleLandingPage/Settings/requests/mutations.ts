import { useMutation } from 'react-query';

import { deleteApi, postApi } from '@/helpers/routing';
import { SettingFormatted } from '@/inpt-shared/scheduling/shared';

export const useSave = (currentSettingId?: Inpt.ObjectId) => {
	return useMutation((newValues: SettingFormatted) => postApi(`/schedules/settings/${currentSettingId}`, newValues));
};

export const useCreate = () => {
	return useMutation((newValues: SettingFormatted) =>
		postApi('/schedules/settings/', newValues).then(({ _id }) => _id)
	);
};

export const useDelete = () => {
	return useMutation((settingIdToDelete: Inpt.ObjectId) => deleteApi(`/schedules/settings/${settingIdToDelete}`));
};

export const useSelect = (scheduleId: Inpt.ObjectId) => {
	return useMutation(async (selectedSettingId: Inpt.ObjectId) => {
		await postApi(`/schedules/${scheduleId}`, { setting: selectedSettingId });
	});
};
