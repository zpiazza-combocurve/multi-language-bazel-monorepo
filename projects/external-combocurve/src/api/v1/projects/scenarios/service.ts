import { Types } from 'mongoose';

import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IScenario } from '@src/models/scenarios';
import { REST_API_USER_ID } from '@src/constants/user';

import { CursorType, IPageData } from '../../pagination';
import { BaseProjectResolved } from '../fields';
import { IMultiStatusResponse } from '../../multi-status';

import { ApiScenario, ApiScenarioKey, getDeleteFilters, getFilters, getSort, toApiScenario } from './fields';

export class ScenarioService extends BaseService<ApiContextV1> {
	static attribute = 'scenarioService';

	async getScenarios(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiScenario>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const scenarios = await this.context.models.ScenarioModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1);

		const result = scenarios.slice(0, take).map(toApiScenario);

		return {
			result,
			hasNext: scenarios.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiScenarioKey] as CursorType)
					: null,
		};
	}

	async getScenariosCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);

		const baseQuery = this.context.models.ScenarioModel.find(mappedFilters);
		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiScenario | null> {
		const scenario = await this.context.models.ScenarioModel.findOne({
			_id: id,
			project: project._id,
		});
		if (!scenario) {
			return null;
		}
		return toApiScenario(scenario);
	}

	async existsById(id: Types.ObjectId, project: BaseProjectResolved): Promise<boolean> {
		return await this.context.models.ScenarioModel.exists({ _id: id, project: project._id });
	}

	async getName(id: Types.ObjectId, project: BaseProjectResolved): Promise<string | null> {
		const scenario = await this.context.models.ScenarioModel.findOne(
			{ _id: id, project: project._id },
			{ name: 1 },
		);
		if (scenario) {
			return scenario.name;
		}
		return null;
	}

	async getNames(projectID: Types.ObjectId): Promise<string[]> {
		const names = await this.context.models.ScenarioModel.find({ project: projectID }, { name: 1 });
		return names.map((m: IScenario) => m.name);
	}

	async upsertScenarios(projecID: Types.ObjectId, scenarios: ApiScenario[]): Promise<IMultiStatusResponse> {
		const upsertScenarios = await this.getUpsertedModel(scenarios, projecID);
		const updateOutput = await this.context.models.ScenarioModel.bulkWrite(
			upsertScenarios
				.filter((f) => f.result.code !== 404)
				.map((m) => ({
					replaceOne: {
						filter: { _id: m.item.id },
						replacement: { ...m.item },
						upsert: true,
					},
				})),
		);

		const { upserted } = updateOutput.result;
		await this.context.models.ProjectModel.updateOne(
			{ _id: projecID },
			{ $push: { scenarios: upserted.map((m: { _id: Types.ObjectId }) => m._id) } },
		);

		const total = updateOutput.result.nUpserted + updateOutput.result.nModified;
		return {
			failedCount: upsertScenarios.length - total,
			successCount: total,
			results: upsertScenarios.map((m) => {
				return m.result;
			}),
		};
	}

	private async getUpsertedModel(scenarios: ApiScenario[], projecID: Types.ObjectId) {
		const ids = scenarios.filter((f) => f.id !== undefined).map((m) => m.id ?? Types.ObjectId());
		const idsQuery = await this.context.models.ScenarioModel.find({ _id: { $in: ids } }, { _id: 1 });

		const dbIDs = idsQuery.map((m: IScenario) => m._id);
		const upsertScenarios = scenarios.map((m) => {
			const isUpdate = m.id !== undefined;
			const id = m.id ?? new Types.ObjectId();
			const hasDBId =
				m.id !== undefined ? dbIDs.findIndex((f: Types.ObjectId) => f.equals(m.id ?? '')) > -1 : true;

			return {
				result: {
					id: id,
					code: isUpdate ? (hasDBId ? 204 : 404) : 201,
					status: isUpdate ? (hasDBId ? 'Updated' : 'NotFound') : 'Created',
				},
				item: {
					id: id,
					name: m.name,
					project: projecID,
					createdBy: REST_API_USER_ID,
				},
			};
		});

		return upsertScenarios;
	}

	async deleteScenarios(projectID: Types.ObjectId, filters: ApiQueryFilters): Promise<number> {
		const queryFilters = getDeleteFilters(filters);
		const query = Object.entries(queryFilters).map((m) => ({ [m[0]]: m[1] }));

		const idsQuery = await this.context.models.ScenarioModel.find({ project: projectID, $or: query }, { _id: 1 });

		const deletedIds = idsQuery.map((m: IScenario) => m._id);

		const deleteQuery = {
			_id: { $in: deletedIds },
			project: projectID,
		} as unknown as IFilter<IScenario>;

		const result = await this.context.models.ScenarioModel.deleteMany(deleteQuery);
		if (result.n !== 0) {
			await this.context.models.ProjectModel.updateOne(
				{ _id: projectID },
				{ $pull: { scenarios: { $in: deletedIds } } },
			);
		}

		return result.n ?? 0;
	}
}
