// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { schemas } from 'combocurve-utils/mongo';
import { Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { BaseService } from '@src/base-context';
import { IScenario } from '@src/models/scenarios';

export class ScenarioWellsService extends BaseService<ApiContextV1> {
	static attribute = 'scenarioWellsService';
	static maxWellsPerScenario = 25000;

	static scenarioWellsProjection = {
		_id: 1,
		wells: 1,
	};

	async getScenarioWells(scenarioId?: Types.ObjectId, projectId?: Types.ObjectId): Promise<IScenario | null> {
		return await this.context.models.ScenarioModel.findOne(
			{
				_id: scenarioId,
				project: projectId,
			},
			ScenarioWellsService.scenarioWellsProjection,
		);
	}

	async getProjectWells(projectID: Types.ObjectId): Promise<Types.ObjectId[] | null> {
		const response = await this.context.models.ProjectModel.find({ _id: projectID }, { wells: 1 });
		return response.length > 0 ? response[0].wells : null;
	}

	async updateScenarioWells(
		id: Types.ObjectId,
		projectID: Types.ObjectId,
		newWellsIDs: Types.ObjectId[],
	): Promise<void> {
		await this.context.models.ScenarioModel.updateOne({ _id: id }, { $push: { wells: newWellsIDs } });

		const newAssignments = newWellsIDs.map((wellID) => ({
			well: wellID,
			scenario: id,
			project: projectID,
			schemaVersion: schemas.ASSIGNMENT_SCHEMA_VERSION,
		}));

		await this.context.models.ScenarioWellAssignmentsModel.insertMany(newAssignments);
	}

	async unassignWells(scenarioId: Types.ObjectId, wellIds: Types.ObjectId[]): Promise<boolean> {
		const scenarioQuery = { scenario: scenarioId };
		const $pull = { wells: { $in: wellIds } };

		const result = await this.context.models.ScenarioModel.updateOne({ _id: scenarioId }, { $pull });

		if (result.nModified === 1) {
			await Promise.all([
				this.context.models.AssumptionModel.deleteMany({ well: { $in: wellIds } }),
				this.context.models.ScenarioWellAssignmentsModel.deleteMany({
					...scenarioQuery,
					well: { $in: wellIds },
				}),
			]);

			return true;
		}

		return false;
	}
}
