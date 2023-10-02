import { RequestHandler } from 'express';
import { Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { EconRunNotFoundError } from '@src/api/v1/projects/scenarios/econ-runs/validation';
import { EconRunService } from '@src/services/econ-runs-service';
import { parseObjectId } from '@src/helpers/validation';

import { serviceResolver } from './service-resolver';

type Locals = {
	econRunService: EconRunService;
	project: BaseProjectResolved;
	scenarioId: Types.ObjectId;
	scenarioName: string | null;
};

const econRunValidationResolver: RequestHandler = async function econRunValidationResolver(req, res, next) {
	const { econRunService, project, scenarioId, scenarioName } = res.locals as Locals;
	const { econRunId } = req.params;
	const econRunIdParsed = parseObjectId(econRunId);

	const econRun = await econRunService.getById(econRunIdParsed, project._id, scenarioId);
	if (!econRun) {
		throw new EconRunNotFoundError(
			`No econ run was found with id \`${econRunIdParsed}\` in project \`${project._id}:${project.name}\` and scenario \`${scenarioId}:${scenarioName}\``,
		);
	}

	res.locals.econRun = { id: econRunIdParsed, runDate: econRun.runDate };

	next();
};

export const econRunResolver = (): RequestHandler[] => {
	const econRunServiceResolver = serviceResolver<ApiContextV1, keyof ApiContextV1>(
		'econRunService',
		'econRunService',
	);

	const econRunValidation = econRunValidationResolver;

	return [econRunServiceResolver, econRunValidation];
};
