import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import { StatusCodes } from 'http-status-codes';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import {
	getValidFilters,
	parseObjectId,
	RequestStructureError,
	validatePaginationFilters,
} from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '../../multi-status';
import { BaseProjectResolved } from '../fields';
import { ValidationErrorAggregator } from '../../multi-error';

import { ApiForecast, filterableFields, READ_RECORD_LIMIT, sortableFields } from './fields';
import { ForecastNotFoundError, parseWellIdPayload, parseWellsToAdd } from './validation';
import { ForecastService } from './service';

const { MULTI_STATUS, OK } = StatusCodes;

type Locals = { service: ForecastService; project: BaseProjectResolved };

const DEFAULT_PAGE_SIZE = 25;

export const getForecastsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getForecastsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getForecasts = async (req: Request, res: Response<ApiForecast[]>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	fixTagQueryParam(query);
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
	} = await service.getForecasts(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getForecastById = async (req: Request, res: Response<ApiForecast>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const forecastId = parseObjectId(id);

	const forecast = await service.getById(forecastId, project);
	if (!forecast) {
		throw new ForecastNotFoundError(
			`No forecast was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(forecast);
};

export const addWellToForecast = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const data = req.body.wellIds;

	if (!data) {
		throw new RequestStructureError('Invalid wellIds data structure');
	}

	const errorAggregator = new ValidationErrorAggregator();

	const forecastId = parseObjectId(id);

	const forecast = await service.getForecastBaseInfo(forecastId, project);
	const projectWellIds = await service.getProjectWellIds(project._id);

	const parsedWellIds = parseWellIdPayload(data, errorAggregator);
	const wellIsInformation = await service.getWellBaseInformation(parsedWellIds);
	const wellIds = parseWellsToAdd(
		forecast,
		project,
		projectWellIds,
		parsedWellIds,
		wellIsInformation,
		errorAggregator,
	);

	const successResponse = await service.addWellsToForecast(forecastId, wellIds);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

/**
 * Replace query param 'tag' for 'tags'
 * @param query The request query string
 * @remarks
 * The API architecture maps query params to MongoDB query
 * The forecast collection has 'tags', not 'tag
 * It's 'tag' on query string because is possible filters just one tag per request
 */
const fixTagQueryParam = (query: ParsedQs) => {
	const tag = 'tag';
	const mongoTagField = 'tags';

	if (tag in query) {
		query[mongoTagField] = query[tag];
		delete query[tag];
	}
};
