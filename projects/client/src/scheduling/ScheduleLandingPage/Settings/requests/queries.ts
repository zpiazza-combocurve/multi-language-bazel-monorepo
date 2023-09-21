import { useMemo } from 'react';
import { UseQueryOptions, useQuery } from 'react-query';

import { getApi } from '@/helpers/routing';
import { Project, Setting } from '@/inpt-shared/scheduling/shared';

export type GetSettingVariables = {
	currentSettingId?: Inpt.ObjectId;
};

export type GetSettingQuery = Setting;

export const useGetSetting = (
	{ currentSettingId }: GetSettingVariables,
	options?: UseQueryOptions<GetSettingQuery>
) => {
	const settingQueryKey = useMemo(() => ['scheduling', 'setting', currentSettingId], [currentSettingId]);
	return useQuery<Setting>(settingQueryKey, () => getApi(`/schedules/settings/${currentSettingId}`), {
		...options,
	});
};

export type GetSettingsByProjectVariables = {
	projectId: Inpt.ObjectId;
};

export type GetSettingsByProjectQuery = Setting[];

export const useGetSettingsByProject = (
	{ projectId }: GetSettingsByProjectVariables,
	options?: UseQueryOptions<GetSettingsByProjectQuery>
) => {
	return useQuery<Setting[]>(
		['settings-by-project', projectId],
		() =>
			getApi('/schedules/settings', {
				projectId,
			}),
		{
			...options,
		}
	);
};

export type GetProjectsVariables = {
	feature: string;
};

export type GetProjectsQuery = Project[];

export const useGetProjects = ({ feature }: GetProjectsVariables, options?: UseQueryOptions<GetProjectsQuery>) =>
	useQuery<Project[]>(
		['my-projects-with-count'],
		() =>
			getApi('/projects/getMyProjectsWithCount', {
				feature,
			}),
		{
			...options,
		}
	);
