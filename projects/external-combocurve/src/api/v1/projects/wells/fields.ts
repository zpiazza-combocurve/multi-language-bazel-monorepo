import { IProject } from '@src/models/projects';

export { WRITE_RECORD_LIMIT, READ_RECORD_LIMIT } from '../../wells/fields';

export const projectResolvedProjection = {
	_id: 1 as const,
	wells: 1 as const,
	name: 1 as const,
};

export type ProjectResolved = Pick<IProject, keyof typeof projectResolvedProjection>;
