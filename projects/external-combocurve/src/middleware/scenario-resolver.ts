import { RequestHandler } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { parseObjectId } from '@src/helpers/validation';
import { ScenarioNotFoundError } from '@src/api/v1/projects/scenarios/validation';
import { ScenarioService } from '@src/api/v1/projects/scenarios/service';

import { serviceResolver } from './service-resolver';

type Locals = { scenarioService: ScenarioService; project: BaseProjectResolved };

const scenarioValidationResolver: RequestHandler = async function scenarioValidationResolver(req, res, next) {
	const { scenarioService, project } = res.locals as Locals;
	const { scenarioId } = req.params;
	const scenarioIdParsed = parseObjectId(scenarioId);

	const exists = await scenarioService.existsById(scenarioIdParsed, project);
	if (!exists) {
		throw new ScenarioNotFoundError(
			`No scenario was found with id \`${scenarioIdParsed}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.locals.scenarioId = scenarioIdParsed;
	res.locals.scenarioName = await scenarioService.getName(scenarioIdParsed, project);

	next();
};

export const scenarioResolver = (): RequestHandler[] => {
	const scenarioServiceResolver = serviceResolver<ApiContextV1, keyof ApiContextV1>(
		'scenarioService',
		'scenarioService',
	);

	const scenarioValidation = scenarioValidationResolver;

	return [scenarioServiceResolver, scenarioValidation];
};
