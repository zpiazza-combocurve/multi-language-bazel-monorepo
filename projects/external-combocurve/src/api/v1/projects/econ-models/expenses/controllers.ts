import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import {
	checkRecordCount,
	getValidFilters,
	isObject,
	parseObjectId,
	RequestStructureError,
	validatePaginationFilters,
} from '@src/helpers/validation';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '@src/api/v1/multi-status';
import { getDeleteHeaders } from '@src/api/v1/delete';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { BaseProjectResolved } from '../../fields';
import { EconModelService } from '../service';

import {
	ApiExpenses,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toExpenses,
	WRITE_RECORD_LIMIT,
} from './fields/expenses';
import { checkModelDuplicates, ExpensesCollisionError, ExpensesNotFoundError, parseApiExpenses } from './validation';
import { ExpensesService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: ExpensesService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getExpensesHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getExpensesCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getExpensesById = async (req: Request, res: Response<ApiExpenses>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const ExpensesModelId = parseObjectId(id);

	const ExpensesModel = await service.getById(ExpensesModelId, project);
	if (!ExpensesModel) {
		throw new ExpensesNotFoundError(
			`No Expenses model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(ExpensesModel);
};

export const getExpenses = async (req: Request, res: Response<ApiExpenses[]>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	validatePaginationFilters(query);

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
		sort: { parse: SortParser(sortableFields), defaultValue: { id: -1 } as ISort },
		cursor: { parse: parseCursor, defaultValue: undefined },
	};

	const { skip, take, sort, cursor: cursorQuery } = castQuery(query, castQueryOptions);

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getExpenses(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postExpenses = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiExpensesModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Expenses model data structure', `[${index}]`);
			}
			return parseApiExpenses(element, index);
		}),
	);

	apiExpensesModels = await service.checkWells(apiExpensesModels, project._id, errorAggregator);
	apiExpensesModels = await service.checkScenarios(apiExpensesModels, project._id, errorAggregator);

	const names = apiExpensesModels.map((ExpensesModel) => ExpensesModel?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiExpensesModels = apiExpensesModels.filter(notNil).map((ExpensesModel, index) =>
		errorAggregator.catch(() => {
			const existName = ExpensesModel.name && existingNames.includes(ExpensesModel.name);
			if (existName) {
				throw new ExpensesCollisionError(
					`Expenses with name \`${ExpensesModel?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return ExpensesModel;
		}),
	);

	apiExpensesModels = checkModelDuplicates(apiExpensesModels, errorAggregator);

	const ExpensesModels = apiExpensesModels.map(
		(ExpensesModel) => ExpensesModel && toExpenses(ExpensesModel, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(ExpensesModels);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putExpenses = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiExpensesModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Expenses model data structure', `[${index}]`);
			}
			return parseApiExpenses(element, index);
		}),
	);

	apiExpensesModels = await service.checkScenarios(apiExpensesModels, project._id, errorAggregator);
	apiExpensesModels = await service.checkWells(apiExpensesModels, project._id, errorAggregator);
	apiExpensesModels = checkModelDuplicates(apiExpensesModels, errorAggregator);

	const ExpensesModels = apiExpensesModels.map(
		(ExpensesModel) => ExpensesModel && toExpenses(ExpensesModel, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(ExpensesModels, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteExpensesById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const ExpensesModelId = parseObjectId(id);

	const deleteCount = await service.deleteExpensesById(ExpensesModelId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
