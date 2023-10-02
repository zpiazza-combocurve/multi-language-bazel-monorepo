import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { Expenses_KEY, IExpenses } from '@src/models/econ/expenses';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiExpenses, ApiExpensesKey, getFilters, getSort, toApiExpenses } from './fields/expenses';

export class ExpensesService extends BaseService<ApiContextV1> {
	static attribute = 'ExpensesModel';

	async getExpensesCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiExpenses | null> {
		const econModel = await this.context.econModelService.getById(id, Expenses_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiExpenses(econModel as IExpenses);
	}

	async getExpenses(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiExpenses>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const ExpensesModel = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IExpenses[];

		const result = ExpensesModel.slice(0, take).map(toApiExpenses);

		return {
			result,
			hasNext: ExpensesModel.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiExpensesKey] as CursorType)
					: null,
		};
	}

	async deleteExpensesById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, Expenses_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiExpensesModels: Array<ApiExpenses | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiExpenses | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiExpensesModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiExpenses | undefined>;
	}

	async checkWells(
		apiExpensesModels: Array<ApiExpenses | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiExpenses | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiExpensesModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiExpenses | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, Expenses_KEY, projectId);
		return result;
	}

	async create(ExpensesModel: Array<IExpenses | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(ExpensesModel, Expenses_KEY);
		return result;
	}

	async upsert(
		ExpensesModel: Array<IExpenses | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(ExpensesModel, projectId, Expenses_KEY);
		return result;
	}
}
