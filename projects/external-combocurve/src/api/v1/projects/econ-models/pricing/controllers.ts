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
	ApiPricing,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toPricing,
	WRITE_RECORD_LIMIT,
} from './fields/pricing';
import { checkModelDuplicates, parseApiPricing, PricingCollisionError, PricingNotFoundError } from './validation';
import { PricingService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: PricingService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getPricingHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getPricingsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getPricingById = async (req: Request, res: Response<ApiPricing>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const pricingModelId = parseObjectId(id);

	const pricingModel = await service.getById(pricingModelId, project);
	if (!pricingModel) {
		throw new PricingNotFoundError(
			`No Pricing model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(pricingModel);
};

export const getPricings = async (req: Request, res: Response<ApiPricing[]>): Promise<void> => {
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
	} = await service.getPricings(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postPricings = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiPricingModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Pricing model data structure', `[${index}]`);
			}
			return parseApiPricing(element, index);
		}),
	);

	apiPricingModels = await service.checkWells(apiPricingModels, project._id, errorAggregator);
	apiPricingModels = await service.checkScenarios(apiPricingModels, project._id, errorAggregator);

	const names = apiPricingModels.map((pricingModel) => pricingModel?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiPricingModels = apiPricingModels.filter(notNil).map((pricingModel, index) =>
		errorAggregator.catch(() => {
			const existName = pricingModel.name && existingNames.includes(pricingModel.name);
			if (existName) {
				throw new PricingCollisionError(
					`Pricing with name \`${pricingModel?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return pricingModel;
		}),
	);

	apiPricingModels = checkModelDuplicates(apiPricingModels, errorAggregator);

	const pricingModels = apiPricingModels.map((pricingModel) => pricingModel && toPricing(pricingModel, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(pricingModels);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putPricings = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiPricingModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Pricing model data structure', `[${index}]`);
			}
			return parseApiPricing(element, index);
		}),
	);

	apiPricingModels = await service.checkScenarios(apiPricingModels, project._id, errorAggregator);
	apiPricingModels = await service.checkWells(apiPricingModels, project._id, errorAggregator);
	apiPricingModels = checkModelDuplicates(apiPricingModels, errorAggregator);

	const pricingModels = apiPricingModels.map((pricingModel) => pricingModel && toPricing(pricingModel, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(pricingModels, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deletePricingById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const pricingModelId = parseObjectId(id);

	const deleteCount = await service.deletePricingById(pricingModelId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
