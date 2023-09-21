import { useConfigurations, useDefaultConfiguration } from '@/components/hooks';
import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';

import { GroupConfiguration } from './types';

export const GROUP_CONFIGURATION_KEY = ['group-configurations'];
export const DEFAULT_GROUP_CONFIGURATION_KEY = ['default-group-configuration'];

export function getGroupConfigurations(): Promise<Required<GroupConfiguration>[]> {
	return getApi(`/scenarios/group-configurations/`);
}

export function getDefaultGroupConfiguration() {
	return getApi(`/scenarios/group-configurations/default`);
}

export function createConfiguration(groupConfiguration: GroupConfiguration) {
	return postApi(`/scenarios/group-configurations/`, groupConfiguration);
}

export function updateConfiguration(groupConfiguration: GroupConfiguration) {
	return putApi(`/scenarios/group-configurations/${groupConfiguration._id}`, groupConfiguration);
}

export function updateDefaultConfiguration(groupConfiguration: GroupConfiguration | null) {
	return postApi(`/scenarios/group-configurations/default`, { _id: groupConfiguration?._id });
}

export function deleteConfiguration(groupConfiguration: GroupConfiguration) {
	return deleteApi(`/scenarios/group-configurations/${groupConfiguration?._id}`);
}
export function useGroupConfigurations() {
	return useConfigurations<GroupConfiguration>({
		queryKey: GROUP_CONFIGURATION_KEY,
		createConfiguration,
		deleteConfiguration,
		updateConfiguration,
		getConfigurations: getGroupConfigurations,
		getCreateAlertMessage: (c) => `Created Group Configuration: "${c.name}"`,
		getUpdateAlertMessage: (c) => `Updated Group Configuration: "${c.name}"`,
		getDeleteAlertMessage: (c) => `Deleted Group Configuration: "${c.name}"`,
	});
}

export function useDefaultGroupConfiguration() {
	return useDefaultConfiguration<GroupConfiguration>({
		getDefaultConfiguration: getDefaultGroupConfiguration,
		queryKey: DEFAULT_GROUP_CONFIGURATION_KEY,
		updateDefaultConfiguration,
	});
}
