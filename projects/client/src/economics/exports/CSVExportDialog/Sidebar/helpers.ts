import _ from 'lodash';
import { useMemo } from 'react';
import { useQuery } from 'react-query';

import { assert } from '@/helpers/utilities';
import { useCurrentProject } from '@/projects/api';
import { useCurrentProjectId } from '@/projects/routes';

import { getProjectNames } from '../api';
import { useUserTemplates } from '../helpers';
import { CSVExportTemplate, SuggestedTemplateSymbol } from '../types';

export function isSuggestedTemplate(c: CSVExportTemplate) {
	return c?.[SuggestedTemplateSymbol];
}

export function useProjectNamesWithTemplates() {
	const currentProjectId = useCurrentProjectId();
	// TODO: avoid using all templates
	const { configurations: allProjectsTemplates, isLoadingConfigurations } = useUserTemplates();

	const allProjects = useMemo(
		() => _.uniq([currentProjectId, ...(_.map(allProjectsTemplates, 'project') ?? [])]),
		[allProjectsTemplates, currentProjectId]
	);

	const { project } = useCurrentProject();

	assert(project);

	return useQuery(['projects', 'names', allProjects], () => getProjectNames(allProjects), {
		enabled: !isLoadingConfigurations,
		placeholderData: [project],
		select: (d) =>
			d.reduce((acc, { _id, name }) => {
				acc[_id] = name;
				return acc;
			}, {}),
	});
}
