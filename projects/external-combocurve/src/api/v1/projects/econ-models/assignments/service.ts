/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { BaseService } from '@src/base-context';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationError } from '@src/helpers/validation';

import { QualifiersService } from '../../scenarios/qualifiers/service';

export interface IEconModelWellQualifiers {
	scenario: Types.ObjectId;
	well: Types.ObjectId;
	qualifierKey: string;
}

export class EconModelAssignmentService extends BaseService<ApiContextV1> {
	static attribute = 'econModelAssignmentService';

	async checkEconModel(econModelId: Types.ObjectId, econName: string): Promise<ValidationError | undefined> {
		if (econName === 'general_options') {
			return new ValidationError(
				`The econ General Options can't be assigned to a well.`,
				'url',
				'InvalidEconName',
			);
		}

		const econKey = await this.context.econModelService.getEconKeyById(econModelId);
		if (econKey === undefined || econKey !== econName) {
			return new ValidationError(
				`The econModel '${econModelId}' is not '${econName}'`,
				'url',
				'EconTypeMismatch',
			);
		}
	}

	async getPageEconModelAssignments(
		projectID: Types.ObjectId,
		econModelID: Types.ObjectId,
		econModelName: string,
		skip: number,
		take: number,
		sort: ISort,
		filterWells?: Types.ObjectId[],
		filterScenarios?: Types.ObjectId[],
	): Promise<{ total: number; items: IEconModelWellQualifiers[] }> {
		const output = await this.context.models.ScenarioWellAssignmentsModel.aggregate([
			{ $match: this.getMatchCriteria(projectID, filterWells, filterScenarios) },
			{
				$project: {
					scenario: 1,
					well: 1,
					qualifiers: {
						$objectToArray: `$${econModelName}`,
					},
				},
			},
			{ $unwind: '$qualifiers' },
			{
				$match: {
					'qualifiers.v.model': econModelID,
				},
			},
			{ $sort: sort },
			{
				$facet: {
					paginatedResults: [
						{ $skip: skip },
						{ $limit: take + 1 },
						{
							$project: {
								_id: 0,
								scenario: 1,
								well: 1,
								qualifierKey: '$qualifiers.k',
							},
						},
					],
					totalCount: [
						{
							$count: 'count',
						},
					],
				},
			},
		]);

		const aux = (output?.length > 0 ? output[0] : {}) as unknown;
		const result = aux as unknown as {
			totalCount: { count: number }[];
			paginatedResults: IEconModelWellQualifiers[];
		};

		return {
			items: result.paginatedResults.slice(0, take),
			total: result.totalCount.length > 0 ? result.totalCount[0].count : 0,
		};
	}

	private getMatchCriteria(
		projectID: Types.ObjectId,
		filterWells?: Types.ObjectId[],
		filterScenarios?: Types.ObjectId[],
	): any {
		const $match: any = {
			project: projectID,
		};

		Object.assign($match, filterWells ? { well: { $in: filterWells } } : undefined);
		Object.assign($match, filterScenarios ? { scenario: { $in: filterScenarios } } : undefined);

		return $match;
	}

	async assignWellsToEcon(
		scenarioID: Types.ObjectId,
		qualifierKey: string,
		econModelKey: string,
		econModelId: Types.ObjectId,
		wells?: Types.ObjectId[],
	): Promise<void> {
		const filter = Object.assign({ scenario: scenarioID }, wells ? { well: { $in: wells } } : undefined);
		await this.context.models.ScenarioWellAssignmentsModel.updateMany(filter, {
			$set: { [`${econModelKey}.${qualifierKey}`]: { model: econModelId } },
		});
	}

	async removeEconFromWells(
		scenarioID: Types.ObjectId,
		qualifierKey: string,
		econModelKey: string,
		wells?: Types.ObjectId[],
	): Promise<number> {
		const filter = Object.assign({ scenario: scenarioID }, wells ? { well: { $in: wells } } : undefined);

		if (qualifierKey === QualifiersService.defaultQualifierKey) {
			const result = await this.context.models.ScenarioWellAssignmentsModel.updateMany(filter, {
				$set: { [`${econModelKey}.${qualifierKey}`]: {} },
			});

			return result.nModified;
		} else {
			const result = await this.context.models.ScenarioWellAssignmentsModel.updateMany(filter, {
				$unset: { [`${econModelKey}.${qualifierKey}`]: '' },
			});

			return result.nModified;
		}
	}
}
