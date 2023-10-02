/* eslint-disable
	@typescript-eslint/no-unused-vars,
	@typescript-eslint/no-non-null-assertion */

import { Types } from 'mongoose';

import { compositionObj, fromParentScope, specs } from '@src/core/metadata/metadata';
import { IMultiStatusResponse, IRecordStatus, multiStatusResponseSample } from '@src/api/v1/multi-status';
import { IProcessedRecord as IProcessableRecord, MultiRecordsRequest } from '@src/core/requests/base';
import { HttpMessageContext } from '@src/core/common';
import { IQualifiers } from '@src/models/scenarios';
import { ValidationError } from '@src/helpers/validation';

import { EconAssignParams, EconAssignServices } from '../compositions';

export class EconModelAssignmentUpsertPayload implements IProcessableRecord {
	@fromParentScope({ expects: 'objectID' })
	scenarioID?: Types.ObjectId;

	@fromParentScope({ isOptional: true, expects: 'array', itemsExpects: 'objectID' })
	wells?: Types.ObjectId[];

	@fromParentScope({ isOptional: true, expects: 'boolean' })
	allWells?: boolean;

	@fromParentScope({ expects: 'string' })
	qualifierName?: string;

	processedStatus?: ValidationError | IRecordStatus;

	isValid(index: number): boolean {
		const hasWells = this.wells !== undefined || this.allWells !== undefined;
		if (!hasWells) {
			this.processedStatus = new ValidationError(
				`'wells' or 'allWells' must be specified`,
				`[${index}]`,
				`RequiredWells`,
			);
		}

		return (
			this.scenarioID !== undefined &&
			this.qualifierName !== undefined &&
			(this.wells !== undefined || this.allWells !== undefined)
		);
	}
}

@specs.produceResponse({ status: 404 })
@specs.produceResponse({ status: 207, schema: multiStatusResponseSample })
export class EconModelAssignmentUpsert extends MultiRecordsRequest<EconModelAssignmentUpsertPayload> {
	@compositionObj()
	params = new EconAssignParams();

	@compositionObj()
	services = new EconAssignServices();

	constructor() {
		super(() => new EconModelAssignmentUpsertPayload());
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

	async handle(input: HttpMessageContext): Promise<IMultiStatusResponse | undefined> {
		const groupedByScenario = this.payloadByScenario();
		const scenarioMap = await this.getScenarioMap(Object.keys(groupedByScenario));

		for (const [scenarioID, scenarioAssigments] of Object.entries(groupedByScenario)) {
			if (scenarioID === '') {
				continue;
			}

			const byQualifier = this.scenarioAssigmentsByQualifier(scenarioAssigments);

			for (const [qualifierName, assigments] of Object.entries(byQualifier)) {
				const result = await this.getQualifierKey(scenarioID, qualifierName, scenarioMap);
				if (result.hasQualifier) {
					await this.assign(scenarioID, result.qualifierKey, assigments);
				} else {
					assigments.forEach((a) => {
						a.processedStatus = {
							status: 'NotFound',
							code: 404,
							chosenID: a.qualifierName,
						};
					});
				}
			}
		}

		return { results: [...this.importAndCompileRecords(this.payload!)] };
	}

	async getQualifierKey(
		scenarioID: string,
		qualifierName: string,
		scenarioQualifiers: Record<string, IQualifiers | undefined>,
	): Promise<{ qualifierKey: string; hasQualifier: boolean }> {
		if (scenarioQualifiers[scenarioID] === undefined) {
			return { qualifierKey: '', hasQualifier: false };
		}

		const qualifierKey = Object.entries(scenarioQualifiers[scenarioID] ?? {}).find(
			([key, value]) => value.name === qualifierName,
		);

		return qualifierKey
			? { qualifierKey: qualifierKey[0], hasQualifier: true }
			: { qualifierKey: '', hasQualifier: false };
	}

	async assign(
		scenarioID: string,
		qualifierKey: string,
		assigments: EconModelAssignmentUpsertPayload[],
	): Promise<void> {
		const hasAllWells = assigments.findIndex((f) => f.allWells === true) !== -1;
		const wells = hasAllWells
			? undefined
			: assigments.reduce((wells, item) => {
					wells.push(...(item.wells ?? []));
					return wells;
			  }, [] as Types.ObjectId[]);

		await this.services.econModelAssignmentService!.assignWellsToEcon(
			Types.ObjectId(scenarioID),
			qualifierKey,
			this.params.econName!.mongoKey,
			this.params.econModelId!,
			wells,
		);

		assigments.forEach((a) => {
			a.processedStatus = {
				status: 'Created',
				code: 201,
				chosenID: a.qualifierName,
			};
		});
	}

	private async getScenarioMap(scenarioIDs: string[]): Promise<Record<string, IQualifiers | undefined>> {
		const scenarioIds = scenarioIDs.filter((id) => id !== '').map((id) => Types.ObjectId(id));
		const scenarios = await this.services.qualifiersService!.getQualifierNames(
			this.params.econName!.mongoKey,
			undefined,
			scenarioIds,
		);

		return scenarios.reduce(
			(map, scenario) => {
				map[scenario._id.toHexString()] = scenario?.columns?.[this.params.econName!.mongoKey ?? '']?.qualifiers;
				return map;
			},
			{} as Record<string, IQualifiers | undefined>,
		);
	}

	private payloadByScenario(): Record<string, EconModelAssignmentUpsertPayload[]> {
		return this.payload!.filter((item, index) => item.isValid(index)).reduce(
			(group, item) => {
				const scenarioMap = group[item.scenarioID?.toHexString() ?? ''] ?? [];
				scenarioMap.push(item);

				group[item.scenarioID?.toHexString() ?? ''] = scenarioMap;
				return group;
			},
			{} as Record<string, EconModelAssignmentUpsertPayload[]>,
		);
	}

	private scenarioAssigmentsByQualifier(
		scenarioRecords: EconModelAssignmentUpsertPayload[],
	): Record<string, EconModelAssignmentUpsertPayload[]> {
		return scenarioRecords.reduce(
			(group, record) => {
				const qualifier = group[record.qualifierName ?? ''] ?? [];
				qualifier.push(record);

				group[record.qualifierName ?? ''] = qualifier;
				return group;
			},
			{} as Record<string, EconModelAssignmentUpsertPayload[]>,
		);
	}
}
