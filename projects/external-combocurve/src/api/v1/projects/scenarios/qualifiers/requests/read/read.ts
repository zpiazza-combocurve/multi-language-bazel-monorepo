/* eslint-disable 
	@typescript-eslint/no-unused-vars, 
	@typescript-eslint/no-non-null-assertion */

import { FilterQuery, Types } from 'mongoose';

import { fromParams, fromQuery, fromServices, specs } from '@src/core/metadata/metadata';
import { EconName } from '@src/value-objects/econ-name';
import { HttpMessageContext } from '@src/core/common';
import { IScenario } from '@src/models/scenarios';
import { QueryRequest } from '@src/core/requests/mongo';

import { IScenarioQualifierResponse, QualifiersService } from '../../service';

const responseOKSample: IScenarioQualifierResponse = {
	forecast: ['forecast_qualifier'],
	capex: ['capex_qualifier'],
	dates: ['dates_qualifier'],
	depreciation: ['depreciation_qualifier'],
	escalation: ['escalation_qualifier'],
	expenses: ['expenses_qualifier'],
	ownershipReversion: ['ownershipReversion_qualifier'],
	productionTaxes: ['productionTaxes_qualifier'],
	actualOrForecast: ['actualOrForecast_qualifier'],
	reservesCategory: ['reservesCategory_qualifier'],
	differentials: ['differentials_qualifier'],
	pricing: ['pricing_qualifier'],
};

@specs.produceResponse({ status: 404 })
@specs.produceResponse({ status: 200, schema: responseOKSample })
export class QualifiersRead extends QueryRequest<IScenario, IScenarioQualifierResponse> {
	@fromParams({ expects: 'objectID' })
	scenarioId?: Types.ObjectId;

	@fromParams({ expects: 'objectID' })
	projectId?: Types.ObjectId;

	@fromQuery({
		expects: 'array',
		itemsExpects: 'string',
		targetConstructor: (input) => new EconName(input as string),
	})
	econName?: EconName[];

	@fromServices()
	qualifiersService?: QualifiersService;

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
		return QualifiersService.qualifiersProjection;
	}

	parseDoc(scenario: IScenario): IScenarioQualifierResponse {
		return this.qualifiersService!.parseScenarioToResponse(scenario, this.econName?.map((e) => e.mongoKey));
	}
}
