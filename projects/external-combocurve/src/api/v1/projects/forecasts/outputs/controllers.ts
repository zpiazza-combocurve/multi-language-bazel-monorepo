import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getValidFilters, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { BaseForecastResolved } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiForecastData, filterableFields, READ_RECORD_LIMIT, sortableFields } from './fields/forecast-outputs';
import { ForecastDataNotFoundError } from './validation';
import { ForecastDataService } from './service';

const { OK } = StatusCodes;

type Locals = { service: ForecastDataService; project: BaseProjectResolved; forecast: BaseForecastResolved };

const DEFAULT_PAGE_SIZE = 25;

export const getForecastDataHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project, forecast } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getForecastDataCount(filters, project, forecast);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getForecastData = async (req: Request, res: Response<ApiForecastData[]>): Promise<void> => {
	const { service, project, forecast } = res.locals as Locals;
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
	} = await service.getForecastData(skip, take, sort, filters, project, forecast, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getForecastDataById = async (req: Request, res: Response<ApiForecastData>): Promise<void> => {
	const { service, project, forecast } = res.locals as Locals;
	const { id } = req.params;

	const forecastId = parseObjectId(id);

	const forecastData = await service.getById(forecastId, project, forecast);
	if (!forecastData) {
		throw new ForecastDataNotFoundError(
			`No forecast data was found with id \`${id}\` in project \`${project._id}:${project.name}\` and forecast \`${forecast.id}:${forecast.name}\``,
		);
	}

	res.status(OK).json(forecastData);
};
