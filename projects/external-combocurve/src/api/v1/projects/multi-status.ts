import { keyBy } from 'lodash';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { IProject } from '@src/models/projects';

import { IMultiStatusResponse, IRecordStatus } from '../multi-status';

const { CREATED } = StatusCodes;

interface IProjectRecordStatus extends IRecordStatus {
	name: string;
}

const getProdKey = (project: IProject) => project.name ?? undefined;

const mapToReturned = (original: Array<IProject | undefined>, returned: IProject[]): Array<IProject | undefined> => {
	const returnedProjectsFiltered = returned
		.map((project) => ({ id: getProdKey(project), project }))
		.filter((obj): obj is { id: string; project: IProject } => !!obj.id);

	const idMap = keyBy(returnedProjectsFiltered, ({ id }) => id);

	return original.map((project) => {
		const id = project && getProdKey(project);
		return (id !== undefined && idMap[id]?.project) || undefined;
	});
};

const toIProjectStatus = ({ _id, name }: IProject) => ({
	id: (_id ?? Types.ObjectId()).toString(),
	name: name ?? '',
});

const toCreatedStatus = (project: IProject) => ({
	status: 'Created',
	code: CREATED,
	...toIProjectStatus(project),
});

export const getCreatedMultiResponse = (
	originalProjects: Array<IProject | undefined>,
	returnedProjects: IProject[],
): IMultiStatusResponse => {
	const mapped = mapToReturned(originalProjects, returnedProjects);
	return { results: mapped.map((p) => p && toCreatedStatus(p)) as IProjectRecordStatus[] };
};
