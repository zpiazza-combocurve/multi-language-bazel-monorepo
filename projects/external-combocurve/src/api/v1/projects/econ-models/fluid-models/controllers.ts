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
	ApiFluidModel,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toFluidModel,
	WRITE_RECORD_LIMIT,
} from './fields/fluid-model';
import {
	checkModelDuplicates,
	FluidModelCollisionError,
	FluidModelNotFoundError,
	parseApiFluidModel,
} from './validation';
import { FluidModelService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: FluidModelService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getFluidModelsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getFluidModelsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getFluidModelById = async (req: Request, res: Response<ApiFluidModel>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const fluidModelId = parseObjectId(id);

	const fluidModel = await service.getById(fluidModelId, project);
	if (!fluidModel) {
		throw new FluidModelNotFoundError(
			`No fluid model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(fluidModel);
};

export const getFluidModels = async (req: Request, res: Response<ApiFluidModel[]>): Promise<void> => {
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
	} = await service.getFluidModels(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postFluidModels = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiFluidModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid fluid model data structure', `[${index}]`);
			}
			return parseApiFluidModel(element, index);
		}),
	);

	apiFluidModels = await service.checkWells(apiFluidModels, project._id, errorAggregator);
	apiFluidModels = await service.checkScenarios(apiFluidModels, project._id, errorAggregator);

	const names = apiFluidModels.map((fluidModel) => fluidModel?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiFluidModels = apiFluidModels.filter(notNil).map((fluidModel, index) =>
		errorAggregator.catch(() => {
			const existName = fluidModel.name && existingNames.includes(fluidModel.name);
			if (existName) {
				throw new FluidModelCollisionError(
					`Fluid Model with name \`${fluidModel?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return fluidModel;
		}),
	);

	apiFluidModels = checkModelDuplicates(apiFluidModels, errorAggregator);

	const fluidModels = apiFluidModels.map((fluidModel) => fluidModel && toFluidModel(fluidModel, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(fluidModels);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putFluidModels = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiFluidModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid fluid model data structure', `[${index}]`);
			}
			return parseApiFluidModel(element, index);
		}),
	);

	apiFluidModels = await service.checkScenarios(apiFluidModels, project._id, errorAggregator);
	apiFluidModels = await service.checkWells(apiFluidModels, project._id, errorAggregator);
	apiFluidModels = checkModelDuplicates(apiFluidModels, errorAggregator);

	const fluidModels = apiFluidModels.map((fluidModel) => fluidModel && toFluidModel(fluidModel, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(fluidModels, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteFluidModelById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const fluidModelId = parseObjectId(id);

	const deleteCount = await service.deleteFluidModelIdById(fluidModelId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
