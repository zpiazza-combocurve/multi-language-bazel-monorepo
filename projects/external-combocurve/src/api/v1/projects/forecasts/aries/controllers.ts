import { Request, Response } from 'express';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getValidFilters, validatePaginationFilters } from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { BaseForecastResolved } from '../fields';
import { BaseProjectResolved } from '../../fields';

import {
	ApiAriesForecastData,
	ariesForecastSettings,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
} from './fields';
import { AriesForecastDataService } from './service';

type Locals = {
	service: AriesForecastDataService;
	project: BaseProjectResolved;
	forecast: BaseForecastResolved;
};

const DEFAULT_PAGE_SIZE = 25;

export const getAriesForecastDataHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project, forecast } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getAriesForecastDataCount(filters, project, forecast);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getAriesForecastData = async (req: Request, res: Response<ApiAriesForecastData[]>): Promise<void> => {
	const { service, project, forecast } = res.locals as Locals;
	const { query } = req;

	validatePaginationFilters(query);

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
		sort: { parse: SortParser(sortableFields), defaultValue: { well: -1 } as ISort },
		cursor: { parse: parseCursor, defaultValue: undefined },
	};

	const { skip, take, sort, cursor: cursorQuery } = castQuery(query, castQueryOptions);

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), {
		...filterableFields,
		...ariesForecastSettings,
	});

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getAriesForecastData(skip, take, sort, filters, project, forecast, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};
