import { Types } from 'mongoose';

import { fromParams, fromServices } from '@src/core/metadata/metadata';
import { EconName } from '@src/value-objects/econ-name';

import { EconModelAssignmentService } from '../service';
import { EconModelService } from '../../service';
import { QualifiersService } from '../../../scenarios/qualifiers/service';
import { ScenarioWellsService } from '../../../scenarios/well-assignments/service';

export class EconAssignServices {
	@fromServices()
	econModelService?: EconModelService;

	@fromServices()
	econModelAssignmentService?: EconModelAssignmentService;

	@fromServices()
	qualifiersService?: QualifiersService;

	@fromServices()
	scenarioWellsService?: ScenarioWellsService;
}

export class EconAssignParams {
	@fromParams({ expects: 'objectID' })
	projectId?: Types.ObjectId;

	@fromParams({
		expects: 'string',
		targetConstructor: (input) => new EconName(input as string),
	})
	econName?: EconName;

	@fromParams({ expects: 'objectID' })
	econModelId?: Types.ObjectId;
}
