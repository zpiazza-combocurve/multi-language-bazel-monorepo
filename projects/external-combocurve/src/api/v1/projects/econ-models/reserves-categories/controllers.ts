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
	ApiReservesCategory,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toReservesCategory,
	WRITE_RECORD_LIMIT,
} from './fields/reserves-category';
import {
	checkDuplicates,
	parseApiReservesCategory,
	ReservesCategoryCollisionError,
	ReservesCategoryNotFoundError,
} from './validation';
import { ReservesCategoryService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: ReservesCategoryService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getReservesCategoriesHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getReservesCategoriesCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getReservesCategoryById = async (req: Request, res: Response<ApiReservesCategory>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const reservesCategoryId = parseObjectId(id);

	const reservesCategory = await service.getById(reservesCategoryId, project);
	if (!reservesCategory) {
		throw new ReservesCategoryNotFoundError(
			`No reserves category was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(reservesCategory);
};

export const getReservesCategories = async (req: Request, res: Response<ApiReservesCategory[]>): Promise<void> => {
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
	} = await service.getReservesCategories(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postReservesCategories = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiReservesCategories = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid reserves category data structure', `[${index}]`);
			}
			return parseApiReservesCategory(element, index);
		}),
	);

	apiReservesCategories = await service.checkWells(apiReservesCategories, project._id, errorAggregator);
	apiReservesCategories = await service.checkScenarios(apiReservesCategories, project._id, errorAggregator);

	const names = apiReservesCategories.map((reservesCategory) => reservesCategory?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiReservesCategories = apiReservesCategories.filter(notNil).map((reservesCategory, index) =>
		errorAggregator.catch(() => {
			const existName = reservesCategory.name && existingNames.includes(reservesCategory.name);
			if (existName) {
				throw new ReservesCategoryCollisionError(
					`Reserves category with name \`${reservesCategory?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return reservesCategory;
		}),
	);

	apiReservesCategories = checkDuplicates(apiReservesCategories, errorAggregator);

	const reservesCategories = apiReservesCategories.map(
		(reservesCategory) => reservesCategory && toReservesCategory(reservesCategory, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(reservesCategories);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putReservesCategories = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiReservesCategories = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid reserves category data structure', `[${index}]`);
			}
			return parseApiReservesCategory(element, index);
		}),
	);

	apiReservesCategories = await service.checkScenarios(apiReservesCategories, project._id, errorAggregator);
	apiReservesCategories = await service.checkWells(apiReservesCategories, project._id, errorAggregator);
	apiReservesCategories = checkDuplicates(apiReservesCategories, errorAggregator);

	const reservesCategories = apiReservesCategories.map(
		(reservesCategory) => reservesCategory && toReservesCategory(reservesCategory, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(reservesCategories, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteReservesCategory = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const escalationModelId = parseObjectId(id);

	const deleteCount = await service.deleteReservesCategoryById(escalationModelId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
