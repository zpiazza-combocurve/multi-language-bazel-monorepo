import { Types } from 'mongoose';

import { EconModelKey, IBaseEconModel } from '@src/models/econ/econ-models';
import { ApiContextV1 } from '@src/api/v1/context';
import { BaseService } from '@src/base-context';
import config from '@src/config';
import { IFilter } from '@src/helpers/mongo-queries';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { notNil } from '@src/helpers/typing';
import { RequestModule } from '@src/helpers/request';
import { REST_API_USER_ID } from '@src/constants/user';

import { BaseProjectResolved } from '../fields';
import { ScenarioNotFoundError } from '../scenarios/validation';
import { ValidationErrorAggregator } from '../../multi-error';
import { WellNotFoundError } from '../../wells/validation';

import { DuplicateNameError, FieldError, ModelCollisionError } from './validation';
import { getCreatedMultiResponse, getOkMultiResponse } from './multi-status';
import { ApiEconModel } from './fields';

const flexApi = new RequestModule(`${config.flexServerUrl}/api`);
const RETRIES = 3;

export enum EconChecks {
	Wells = 2,
	Scenarios = 4,
	Names = 8,
	Duplicates = 16,
	All = Wells | Scenarios | Names | Duplicates,
}

function hasCheck(allowChecks: EconChecks, targetCheck: EconChecks): boolean {
	return (allowChecks & targetCheck) === targetCheck;
}

export class EconModelService extends BaseService<ApiContextV1> {
	static attribute = 'econModelService';

	async getCount(filters: IFilter): Promise<number> {
		const baseQuery = this.context.models.AssumptionModel.find(filters);
		const countQuery = Object.keys(filters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	public async getEconKeyById(id: Types.ObjectId): Promise<string | undefined> {
		const econ = await this.context.models.AssumptionModel.findOne({ _id: id }, { assumptionKey: 1 });
		return econ?.assumptionKey;
	}

	async getById(
		id: Types.ObjectId,
		econModelKey: EconModelKey,
		project: BaseProjectResolved,
	): Promise<IBaseEconModel | null> {
		const econModels = await this.context.models.AssumptionModel.findOne({
			_id: id,
			assumptionKey: econModelKey,
			project: project._id,
		});
		if (!econModels) {
			return null;
		}
		return econModels;
	}

	async deleteById(id: Types.ObjectId, econModelKey: EconModelKey, project: BaseProjectResolved): Promise<number> {
		if (
			!(await this.context.models.AssumptionModel.exists({
				_id: id,
				assumptionKey: econModelKey,
				project: project._id,
			}))
		) {
			return 0;
		}

		const successCount = await this.context.models.AssumptionModel.deleteOne({
			_id: id,
		}).exec();

		return successCount.deletedCount as number;
	}

	async getExistingScenarioIds(scenarioIds: Types.ObjectId[], projectId: Types.ObjectId): Promise<Types.ObjectId[]> {
		const ids = await this.context.models.ScenarioModel.find(
			{
				_id: { $in: scenarioIds },
				project: projectId,
			},
			'_id',
		);
		return ids.map(({ _id }) => _id);
	}

	async econChecks(
		econModelKey: EconModelKey,
		econModels: Array<ApiEconModel | undefined>,
		projectId: Types.ObjectId,
		errorAggregator: ValidationErrorAggregator,
		checks: EconChecks = EconChecks.All,
	): Promise<Array<ApiEconModel>> {
		let econs = econModels;

		if (hasCheck(checks, EconChecks.Wells)) {
			econs = await this.checkWells(econs, projectId, errorAggregator);
		}

		if (hasCheck(checks, EconChecks.Scenarios)) {
			econs = await this.checkScenarios(econs, projectId, errorAggregator);
		}

		if (hasCheck(checks, EconChecks.Names)) {
			econs = await this.checkUniqueNames(econs, econModelKey, projectId, errorAggregator);
		}

		if (hasCheck(checks, EconChecks.Duplicates)) {
			econs = this.checkModelDuplicates(econs, errorAggregator);
		}

		return econs.filter(notNil);
	}

	private async checkUniqueNames(
		econs: (ApiEconModel | undefined)[],
		econModelKey: EconModelKey,
		projectId: Types.ObjectId,
		errorAggregator: ValidationErrorAggregator,
	) {
		const names = econs.map((econ) => econ?.name);
		const existingNames = await this.getExistingNames(names.filter(notNil), econModelKey, projectId);

		econs = econs.map((econ, index) => {
			if (econ) {
				return errorAggregator.catch(() => {
					const existName = econ.name && existingNames.includes(econ.name);
					if (existName) {
						throw new ModelCollisionError(
							`The model with name \`${econ?.name}\` already exists in project \`${projectId}\``,
							`[${index}]`,
						);
					}
					return econ;
				});
			}
		});

		return econs;
	}

	checkModelDuplicates<T extends ApiEconModel>(
		econModels: Array<T | undefined>,
		errorAggregator: ValidationErrorAggregator,
	): Array<T | undefined> {
		const hashTb = new Map<string, number[]>();
		econModels.forEach((econ, index) => {
			if (econ && econ.name) {
				const indexes = hashTb.get(econ.name) ?? [];
				indexes.push(index);
				hashTb.set(econ.name, indexes);
			}
		});

		hashTb.forEach((indexes, name) => {
			errorAggregator.catch(() => {
				if (indexes.length > 1) {
					// Removing duplicates
					indexes.forEach((index) => econModels.splice(index, 1));

					throw new DuplicateNameError(
						`More than one econ model data supplied with name \`${name}\``,
						`[${indexes.join(', ')}]`,
					);
				}
			});
		});

		return econModels;
	}

	async checkScenarios(
		econModels: Array<ApiEconModel | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiEconModel | undefined>> {
		const scenarioIds = econModels
			.filter((econModels) => notNil(econModels) && econModels.unique)
			.map((econModels) => econModels?.scenario);
		const existingScenarioIds = await this.getExistingScenarioIds(scenarioIds.filter(notNil), projectId);
		const existingStringScenarioIds = existingScenarioIds.map((s) => s.toString());

		return econModels.map(
			(econModel, index) =>
				errorAggregator?.catch(() => {
					const isUnique = econModel && econModel.unique;
					if (!isUnique && econModel?.scenario) {
						throw new FieldError('Cannot set scenario on not unique models', `[${index}]`);
					}
					const existScenarioId =
						econModel?.scenario && existingStringScenarioIds.includes(econModel.scenario.toString());

					if (econModel && isUnique && !existScenarioId) {
						throw new ScenarioNotFoundError(
							`No scenario was found with id \`${econModel.scenario}\` in project \`${projectId}\``,
							`[${index}]`,
						);
					}
					return econModel;
				}),
		);
	}

	async checkWells(
		econModels: Array<ApiEconModel | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiEconModel | undefined>> {
		const wellIds = econModels
			.filter((econModel) => notNil(econModel) && econModel.unique)
			.map((econModel) => econModel?.well);
		const existingWellIds = await this.getExistingWellIds(wellIds.filter(notNil));
		const existingStringWellIds = existingWellIds.map((w) => w.toString());

		return econModels.map(
			(econModel, index) =>
				errorAggregator?.catch(() => {
					const isUnique = econModel && econModel.unique;
					if (!isUnique && econModel?.well) {
						throw new FieldError('Cannot set well on not unique models', `[${index}]`);
					}

					const existWellId = econModel?.well && existingStringWellIds.includes(econModel.well.toString());

					if (econModel && isUnique && !existWellId) {
						throw new WellNotFoundError(
							`No well was found with id \`${econModel.well}\` in project \`${projectId}\``,
							`[${index}]`,
						);
					}
					return econModel;
				}),
		);
	}

	async getExistingWellIds(wellIds: Types.ObjectId[]): Promise<Types.ObjectId[]> {
		const ids = await this.context.models.WellModel.find(
			{
				_id: { $in: wellIds },
			},
			'_id',
		);
		return ids.map(({ _id }) => _id);
	}

	async getExistingNames(names: string[], econModelKey: EconModelKey, projectId: Types.ObjectId): Promise<string[]> {
		const models = await this.context.models.AssumptionModel.find(
			{
				name: { $in: names },
				assumptionKey: econModelKey,
				project: projectId,
			},
			'name',
		);
		return models.map(({ name }) => name);
	}

	async addOptions(econModels: IBaseEconModel[], econModelKey: EconModelKey): Promise<void> {
		if (!econModels.length) {
			return;
		}
		flexApi.setHeaders({ ...this.context.headers });
		const options = await flexApi.postApi(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: econModelKey,
				econ_functions: econModels.map(({ econ_function }) => econ_function),
			},
			RETRIES,
		);

		econModels.forEach((econModel, index) => (econModel.options = options ? options[index] : {}));
	}

	async create(
		econModels: Array<IBaseEconModel | undefined>,
		econModelKey: EconModelKey,
		addOptions = true,
	): Promise<IMultiStatusResponse> {
		const validEconModels = econModels.filter(notNil);

		if (addOptions) {
			await this.addOptions(validEconModels, econModelKey);
		}

		let created: IBaseEconModel[] = [];
		if (validEconModels.length > 0) {
			created = await this.context.models.AssumptionModel.insertMany(
				validEconModels.map((rc) => ({
					...rc,
					createdBy: REST_API_USER_ID,
					lastUpdatedBy: REST_API_USER_ID,
				})),
			);
		}
		return getCreatedMultiResponse(econModels, created);
	}

	async upsert(
		econModels: Array<IBaseEconModel | undefined>,
		projectId: Types.ObjectId,
		econModelKey: EconModelKey,
		addOptions = true,
	): Promise<IMultiStatusResponse> {
		const validEconModels = econModels.filter(notNil);

		if (addOptions) {
			await this.addOptions(validEconModels, econModelKey);
		}

		const replaceOperations = validEconModels.map((econModel) => ({
			replaceOne: {
				filter: {
					name: econModel.name,
					assumptionKey: econModelKey,
					project: projectId,
				},
				replacement: { ...econModel, createdBy: REST_API_USER_ID, lastUpdatedBy: REST_API_USER_ID },
				upsert: true,
			},
		}));
		if (replaceOperations.length > 0) {
			await this.context.models.AssumptionModel.bulkWrite(replaceOperations);
		}

		const upserted = await this.getExistingNames(
			validEconModels.map(({ name }) => name),
			econModelKey,
			projectId,
		);
		return getOkMultiResponse(
			econModels,
			upserted.map((name) => ({
				name,
			})) as IBaseEconModel[],
		);
	}
}
