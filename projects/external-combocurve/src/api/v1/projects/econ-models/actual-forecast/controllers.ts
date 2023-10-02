import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ACTUAL_FORECAST_KEY, IActualOrForecast } from '@src/models/econ/actual-forecast';
import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import { checkRecordCount, getValidFilters, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import { createFinalMultiResponse, emptyResponse, IMultiStatusResponse } from '@src/api/v1/multi-status';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getDeleteHeaders } from '@src/api/v1/delete';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { EconChecks, EconModelService } from '../service';
import { BaseProjectResolved } from '../../fields';

import { ActualForecastNotFoundError, parseActualOrForecastPayload } from './validation';
import { ApiActualForecast, filterableFields, getRequestFromDocument, sortableFields } from './fields/actual-forecast';
import { ActualForecastService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = {
	service: ActualForecastService;
	project: BaseProjectResolved;
	econModelService: EconModelService;
};

const DEFAULT_PAGE_SIZE = 25;
export const ACTUAL_FORECAST_WRL = 500;
export const ACTUAL_FORECAST_RRL = 200;

export const getActualForecastCount = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, ACTUAL_FORECAST_RRL), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getActualForecastById = async (req: Request, res: Response<ApiActualForecast>): Promise<void> => {
	const { econModelService, project } = res.locals as Locals;
	const { id } = req.params;

	const econID = parseObjectId(id);

	const output = await econModelService.getById(econID, ACTUAL_FORECAST_KEY, project);
	if (!output) {
		throw new ActualForecastNotFoundError(`ActualForecast with id ${id} not found`);
	}

	res.status(OK).json(getRequestFromDocument(output as IActualOrForecast));
};

export const getActualForecasts = async (req: Request, res: Response<ApiActualForecast[]>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	validatePaginationFilters(query);

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, ACTUAL_FORECAST_RRL), defaultValue: DEFAULT_PAGE_SIZE },
		sort: { parse: SortParser(sortableFields), defaultValue: { id: -1 } as ISort },
		cursor: { parse: parseCursor, defaultValue: undefined },
	};

	const { skip, take, sort, cursor: cursorQuery } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getPaginated(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postActualOrForecast = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	await upsertActualForecast(req, res, EconChecks.All, (validMoldes: ApiActualForecast[]) =>
		service.create(validMoldes, project._id),
	);
};

export const putActualOrForecast = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const updateChecks = EconChecks.Duplicates | EconChecks.Wells | EconChecks.Scenarios;
	await upsertActualForecast(req, res, updateChecks, (validMoldes: ApiActualForecast[]) =>
		service.upsert(validMoldes, project._id),
	);
};

/**
 * POST or PUT actual or forecast data
 * @param req the HTTP request
 * @param res the HTTP response
 * @param checks the checks to perform on payload (on update it's done few checks than on create)
 * @param targetFN the function to call to create or update the data
 */
const upsertActualForecast = async (
	req: Request,
	res: Response<IMultiStatusResponse>,
	checks: number,
	targetFN: (models: ApiActualForecast[]) => Promise<IMultiStatusResponse>,
): Promise<void> => {
	const { project, econModelService } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, ACTUAL_FORECAST_WRL);

	const errors = new ValidationErrorAggregator();
	let successResponse: IMultiStatusResponse = emptyResponse;

	const models = parseActualOrForecastPayload(data, project._id, errors);

	if (models.some(notNil)) {
		const validOnes = await econModelService.econChecks(ACTUAL_FORECAST_KEY, models, project._id, errors, checks);

		if (validOnes.some(notNil)) {
			successResponse = await targetFN(validOnes.map((m) => m as ApiActualForecast));
		}
	}

	res.status(MULTI_STATUS).json(createFinalMultiResponse(successResponse, errors));
};

export const deleteActualForecastById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { id } = req.params;
	const { econModelService, project } = res.locals as Locals;

	const econID = parseObjectId(id);
	const deleteCount = await econModelService.deleteById(econID, ACTUAL_FORECAST_KEY, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
