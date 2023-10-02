import { Types } from 'mongoose';

import { IQualifiers, IScenario } from '@src/models/scenarios';
import { ApiContextV1 } from '@src/api/v1/context';
import { BaseService } from '@src/base-context';
import { EconName } from '@src/value-objects/econ-name';

export type scenarioQualifierItem = {
	name: string;
};

export interface IScenarioQualifierResponse {
	forecast?: string[];
	capex?: string[];
	dates?: string[];
	depreciation?: string[];
	escalation?: string[];
	expenses?: string[];
	ownershipReversion?: string[];
	productionTaxes?: string[];
	actualOrForecast?: string[];
	reservesCategory?: string[];
	differentials?: string[];
	pricing?: string[];
}

export class QualifiersService extends BaseService<ApiContextV1> {
	static attribute = 'qualifierService';
	static defaultQualifierKey = 'default';
	static defaultQualifierName = 'Default';

	static qualifiersProjection = {
		_id: 1,
		columns: 1,
	};

	async getQualifierNames(
		econKey: string,
		projectID: Types.ObjectId | undefined,
		filteredScenarios: Types.ObjectId[],
	): Promise<IScenario[]> {
		return await this.context.models.ScenarioModel.find(
			Object.assign({ _id: { $in: filteredScenarios } }, projectID ? { project: projectID } : {}),
			{ [`columns.${econKey}.qualifiers`]: 1 },
		);
	}

	async getScenarioWithOnlyQualifiers(
		scenarioId?: Types.ObjectId,
		projectId?: Types.ObjectId,
	): Promise<IScenario | null> {
		return await this.context.models.ScenarioModel.findOne(
			Object.assign({ _id: scenarioId }, projectId ? { project: projectId } : {}),
			QualifiersService.qualifiersProjection,
		);
	}

	parseScenarioToResponse(item: IScenario, filteredEcons?: string[]): IScenarioQualifierResponse {
		const output: Record<string, unknown> = {};

		if (item && item.columns) {
			for (const [mongoEconKey, qualifierObj] of Object.entries(item.columns)) {
				if (filteredEcons === undefined || filteredEcons.includes(mongoEconKey)) {
					const econApiKey = EconName.apiKeyFromMongo(mongoEconKey);
					if (econApiKey) {
						output[econApiKey] = this.getQualifiersFromEcon(qualifierObj.qualifiers);
					}
				}
			}
		}

		return output as unknown as IScenarioQualifierResponse;
	}

	private getQualifiersFromEcon(econQualifiers: IQualifiers): string[] {
		return Object.values(econQualifiers).map((qualifier) => qualifier.name);
	}

	getAllEconQualifierFromScenario(econName: string, qualifiers: IScenario): IQualifiers {
		const aux = qualifiers.columns ?? {};
		return aux[econName].qualifiers;
	}

	getActiveEconQualifierFromScenario(econName: string, qualifiers: IScenario): string {
		const aux = qualifiers.columns ?? {};
		return aux[econName].activeQualifier as string;
	}

	async updateScenarioQualifiers(updatedScenario: IScenario, affectedEconModels: string[]): Promise<void> {
		if (affectedEconModels.length === 0) {
			return;
		}

		const columns = updatedScenario.columns ?? {};
		const update = {} as Record<string, unknown>;

		for (const affectedEconName of affectedEconModels) {
			update[`columns.${affectedEconName}`] = columns[affectedEconName];
		}

		await this.context.models.ScenarioModel.updateOne(
			{
				_id: updatedScenario._id,
			},
			{
				$set: update,
			},
		);
	}

	async deleteScenarioQualifiers(
		scenario: IScenario,
		// EconModelKey : deletedQualifierKey[]
		deletedQualifierKeysByEconModel: Record<string, string[]>,
	): Promise<void> {
		this.updateScenarioQualifiers(scenario, Object.keys(deletedQualifierKeysByEconModel));

		const filter = { scenario: scenario._id };
		const update = Object.entries(deletedQualifierKeysByEconModel).reduce(
			(acc, [econKey, qualifiers]) => {
				qualifiers.forEach((deletedQualifierKey: string) => {
					acc[`${econKey}.${deletedQualifierKey}`] = '';
				});

				return acc;
			},
			{} as Record<string, string>,
		);

		await this.context.models.ScenarioWellAssignmentsModel.updateMany(filter, {
			$unset: update,
		});
	}
}
