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
	ApiDepreciation,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toDepreciation,
	WRITE_RECORD_LIMIT,
} from './fields/depreciation-econ-function';
import {
	checkModelDuplicates,
	DepreciationCollisionError,
	DepreciationNotFoundError,
	parseApiDepreciation,
} from './validation';
import { DepreciationService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: DepreciationService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getDepreciationHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getDepreciationsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getDepreciationById = async (req: Request, res: Response<ApiDepreciation>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const depreciationModelId = parseObjectId(id);

	const depreciationModel = await service.getById(depreciationModelId, project);
	if (!depreciationModel) {
		throw new DepreciationNotFoundError(
			`No Depreciation model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(depreciationModel);
};

export const getDepreciation = async (req: Request, res: Response<ApiDepreciation[]>): Promise<void> => {
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
	} = await service.getDepreciations(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postDepreciation = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiDepreciationModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Depreciation model data structure', `[${index}]`);
			}
			return parseApiDepreciation(element, index);
		}),
	);

	apiDepreciationModels = await service.checkWells(apiDepreciationModels, project._id, errorAggregator);
	apiDepreciationModels = await service.checkScenarios(apiDepreciationModels, project._id, errorAggregator);

	const names = apiDepreciationModels.map((depreciationModel) => depreciationModel?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiDepreciationModels = apiDepreciationModels.filter(notNil).map((depreciationModel, index) =>
		errorAggregator.catch(() => {
			const existName = depreciationModel.name && existingNames.includes(depreciationModel.name);
			if (existName) {
				throw new DepreciationCollisionError(
					`Depreciation model with name \`${depreciationModel?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return depreciationModel;
		}),
	);

	apiDepreciationModels = checkModelDuplicates(apiDepreciationModels, errorAggregator);

	const depreciationModels = apiDepreciationModels.map(
		(depreciationModel) => depreciationModel && toDepreciation(depreciationModel, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(depreciationModels);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putDepreciation = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiDepreciationModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Depreciation model data structure', `[${index}]`);
			}
			return parseApiDepreciation(element, index);
		}),
	);

	apiDepreciationModels = await service.checkScenarios(apiDepreciationModels, project._id, errorAggregator);
	apiDepreciationModels = await service.checkWells(apiDepreciationModels, project._id, errorAggregator);
	apiDepreciationModels = checkModelDuplicates(apiDepreciationModels, errorAggregator);

	const depreciationModels = apiDepreciationModels.map(
		(depreciationModel) => depreciationModel && toDepreciation(depreciationModel, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(depreciationModels, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteDepreciationById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const depreciationModelId = parseObjectId(id);

	const deleteCount = await service.deleteDepreciationById(depreciationModelId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
