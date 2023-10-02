import { RequestHandler } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { IProject } from '@src/models/projects';
import { IProjection } from '@src/helpers/mongo-queries';
import { parseObjectId } from '@src/helpers/validation';
import { ProjectBaseService } from '@src/api/v1/projects/service';
import { ProjectNotFoundError } from '@src/api/v1/projects/validation';

import { serviceResolver } from './service-resolver';

type Locals = { projectBaseService: ProjectBaseService };

const projectValidationResolver = (projection: IProjection<IProject>): RequestHandler =>
	async function projectValidationResolver(req, res, next) {
		const { projectBaseService } = res.locals as Locals;
		const { projectId } = req.params;
		const projectIdParsed = parseObjectId(projectId);

		const project = await projectBaseService.getById(projectIdParsed, projection);
		if (!project) {
			throw new ProjectNotFoundError(`No project was found with id \`${projectIdParsed}\``);
		}

		res.locals.project = project;

		next();
	};

export const projectResolver = (projection: IProjection<IProject> = { _id: 1, name: 1 }): RequestHandler[] => {
	const projectServiceResolver = serviceResolver<ApiContextV1, keyof ApiContextV1>(
		'projectBaseService',
		'projectBaseService',
	);

	const projectValidation = projectValidationResolver(projection);

	return [projectServiceResolver, projectValidation];
};
