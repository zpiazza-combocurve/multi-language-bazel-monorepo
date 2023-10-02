/* eslint-disable 
	@typescript-eslint/no-unused-vars, 
	@typescript-eslint/no-non-null-assertion */

import { FilterQuery, Types } from 'mongoose';

import { fromParams, specs } from '@src/core/metadata/metadata';
import { HttpMessageContext } from '@src/core/common';
import { IScenario } from '@src/models/scenarios';
import { QueryRequest } from '@src/core/requests/mongo';

import { ScenarioWellsService } from '../../service';

export type ScenarioWellsReadResponse = {
	wells: string[];
};

const responseOKSample: ScenarioWellsReadResponse = {
	wells: ['5e272d72b78910dd2a1d5c16'],
};

@specs.produceResponse({ status: 404 })
@specs.produceResponse({ status: 200, schema: responseOKSample })
export class ScenarioWellsRead extends QueryRequest<IScenario, ScenarioWellsReadResponse> {
	@fromParams({ expects: 'objectID' })
	scenarioId?: Types.ObjectId;

	@fromParams({ expects: 'objectID' })
	projectId?: Types.ObjectId;

	constructor() {
		super('scenarios');
	}

	filter(input: HttpMessageContext): FilterQuery<IScenario> {
		return {
			_id: this.scenarioId,
			project: this.projectId,
		};
	}

	projection(input: HttpMessageContext): unknown {
		return ScenarioWellsService.scenarioWellsProjection;
	}

	parseDoc(item: IScenario): ScenarioWellsReadResponse {
		return {
			wells: item.wells.map((well) => well.toString()),
		};
	}
}
