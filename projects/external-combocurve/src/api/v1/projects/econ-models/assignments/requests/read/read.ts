/* eslint-disable
	@typescript-eslint/no-unused-vars,
	@typescript-eslint/no-non-null-assertion */

import { Types } from 'mongoose';

import { CommandRequest, PageInfo } from '@src/core/requests/base';
import { compositionObj, fromQuery, specs } from '@src/core/metadata/metadata';
import { getPaginationDataWithTotal, getPaginationHeaders } from '@src/api/v1/pagination';
import { getUrlData } from '@src/helpers/express';
import { HttpMessageContext } from '@src/core/common';
import { ISort } from '@src/helpers/mongo-queries';
import { QualifiersService } from '@src/api/v1/projects/scenarios/qualifiers/service';

import { EconAssignParams, EconAssignServices } from '../compositions';
import { IEconModelWellQualifiers } from '../../service';

export interface EconModelsAssignmentsReadResponse {
	scenario: string;
	well: string;
	qualifier: string;
}

const responseSchema = {
	scenario: '5e276e31876cd70012ddf3f6',
	well: '5e272d75b78910dd2a1d8521',
	qualifier: 'qualifier_name',
};

@specs.produceResponse({ status: 400 })
@specs.produceResponse({ status: 200, schema: responseSchema, headers: { 'X-Query-Count': 0, Link: '' } })
export class EconModelsAssignmentsRead extends CommandRequest<EconModelsAssignmentsReadResponse[]> {
	@compositionObj()
	params = new EconAssignParams();

	@compositionObj()
	services = new EconAssignServices();

	@compositionObj()
	page = new PageInfo(0, 100);

	@fromQuery({ expects: 'array', itemsExpects: 'objectID' })
	wells?: Types.ObjectId[];

	@fromQuery({ expects: 'array', itemsExpects: 'objectID' })
	scenarios?: Types.ObjectId[];

	@fromQuery({ expects: 'sort', requirements: { validValues: ['scenario', 'well'] } })
	sort: ISort;

	constructor() {
		super();
		this.sort = { scenario: 1 };
	}

	async validate(input: HttpMessageContext): Promise<boolean> {
		const EconTypeMismatchError = await this.services.econModelAssignmentService!.checkEconModel(
			this.params.econModelId!,
			this.params.econName!.mongoKey,
		);

		if (EconTypeMismatchError) {
			this.errors.push(EconTypeMismatchError);
		}

		return this.errors.length === 0;
	}

	async handle(input: HttpMessageContext): Promise<EconModelsAssignmentsReadResponse[] | undefined> {
		const assignments = await this.services!.econModelAssignmentService!.getPageEconModelAssignments(
			this.params.projectId!,
			this.params.econModelId!,
			this.params.econName!.mongoKey,
			this.page.skip,
			this.page.take,
			this.sort,
			this.wells,
			this.scenarios,
		);

		this.setPageHeaders(input, assignments);

		const scenarioQualifiersMap = await this.getQualifierNamesMap(assignments.items);
		return [...this.generateResponse(assignments.items, scenarioQualifiersMap)];
	}

	async getQualifierNamesMap(
		assignments: IEconModelWellQualifiers[],
	): Promise<Record<string, Record<string, string>>> {
		// We need to return the qualifier name saved on scenario, so we create this map to do a fast lookup
		// scenarioID: {qualifierKey: qualifierName}
		const map: Record<string, Record<string, string>> = {};

		for (const assign of assignments) {
			if (assign.qualifierKey === QualifiersService.defaultQualifierKey) {
				continue;
			}

			const idStr = assign.scenario.toHexString();
			map[idStr] = {};
		}

		const distinctScenarioIds = Object.keys(map).map((id) => Types.ObjectId(id));
		if (distinctScenarioIds.length === 0) {
			return map;
		}

		const scenarioQualifiers = await this.services!.qualifiersService!.getQualifierNames(
			this.params!.econName!.mongoKey,
			this.params!.projectId!,
			distinctScenarioIds,
		);

		// Complete map with qualifier name
		for (const scenarioQualifier of scenarioQualifiers) {
			const idStr = scenarioQualifier._id.toHexString();
			const econQualifiers = scenarioQualifier.columns![this.params.econName!.mongoKey];

			if (econQualifiers) {
				Object.entries(econQualifiers.qualifiers).forEach(([qualifierKey, qualifierName]) => {
					const scenarioMap = map[idStr] ?? {};
					scenarioMap[qualifierKey] = qualifierName.name;
				});
			}
		}

		return map;
	}

	*generateResponse(
		assignments: IEconModelWellQualifiers[],
		map: Record<string, Record<string, string>>,
	): Generator<EconModelsAssignmentsReadResponse> {
		for (const assign of assignments) {
			const output: EconModelsAssignmentsReadResponse = {
				scenario: assign.scenario.toHexString(),
				well: assign.well.toHexString(),
				qualifier: QualifiersService.defaultQualifierName,
			};

			if (assign.qualifierKey !== QualifiersService.defaultQualifierKey) {
				const qualifierName = map[assign.scenario.toHexString()]?.[assign.qualifierKey];
				if (qualifierName) {
					output.qualifier = qualifierName;
				}
			}

			yield output;
		}
	}

	private setPageHeaders(
		input: HttpMessageContext,
		assignments: { total: number; items: IEconModelWellQualifiers[] },
	) {
		const urlData = getUrlData(input.request);
		const paginationData = getPaginationDataWithTotal(urlData, this.page.skip, this.page.take, assignments.total);

		input.response.set(getPaginationHeaders(paginationData));
	}
}
