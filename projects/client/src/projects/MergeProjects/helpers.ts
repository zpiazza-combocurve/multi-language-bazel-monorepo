import { ProjectCustomHeader } from '@/helpers/project-custom-headers';

import { PREFIX_VALUE, SUFFIX_VALUE } from './constants';
import { MergedProjectCustomHeaderModel } from './models';

export const getModuleDuplicateName = (originalName: string, part: string, modifier: string) => {
	switch (part) {
		case SUFFIX_VALUE:
			return `${originalName}${modifier}`;

		case PREFIX_VALUE:
			return `${modifier}${originalName}`;

		default:
			return originalName;
	}
};

export const getMergedCustomHeaderPartUniqueKey = (projectId: string, headerKey: string): string =>
	`${projectId}_${headerKey}`;

export const getCustomHeaderDnDType = (headerType: string) => {
	return `custom-header_${headerType}`;
};

export const createMergedCustomHeaderPart = (
	header: ProjectCustomHeader,
	project: Assign<Inpt.Project, { createdBy: Inpt.User }> | Record<string, never>,
	prior: boolean
) => {
	const uniqueKey = getMergedCustomHeaderPartUniqueKey(project._id, header.name);

	return {
		key: uniqueKey,
		originalKey: header.name,
		type: header.headerType.type,
		name: header.label,
		projectId: project._id,
		projectName: project.name,
		prior,
	};
};

export const createMergedCustomHeaderFromSingleCustomHeader = (
	project: Assign<Inpt.Project, { createdBy: Inpt.User }> | Record<string, never>,
	header: ProjectCustomHeader
): MergedProjectCustomHeaderModel => {
	const headerPart = createMergedCustomHeaderPart(header, project, true);

	return {
		key: `${headerPart.key}_${Date.now()}`,
		name: header.label,
		color: '',
		headers: [headerPart],
	};
};
