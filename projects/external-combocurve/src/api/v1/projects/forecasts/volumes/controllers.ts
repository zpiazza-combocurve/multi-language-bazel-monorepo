import { Request, Response } from 'express';

import { castQuery, dateToIdxParser, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getValidFilters, validateDateIdxRange, validatePaginationFilters } from '@src/helpers/validation';
import config from '@src/config';
import { ForecastResolutions } from '@src/models/forecast-volume';
import { ForecastVolumeService } from '@src/services/forecast-volume-service';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { BaseForecastResolved } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiForecastVolumes, filterableFields, READ_RECORD_LIMIT, sortableFields } from './fields/forecast-volumes';

const DEFAULT_PAGE_SIZE = 25;

type Locals = { service: ForecastVolumeService; project: BaseProjectResolved; forecast: BaseForecastResolved };

export const getForecastVolumesHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project, forecast } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getForecastVolumesCount(filters, project, forecast);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getForecastVolumes = async (
	req: Request,
	res: Response<ApiForecastVolumes[]>,
	resolution: ForecastResolutions,
): Promise<void> => {
	const { service, project, forecast } = res.locals as Locals;
	const { query } = req;

	validatePaginationFilters(query);

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
		sort: { parse: SortParser(sortableFields), defaultValue: { well: 1 } as ISort },
		cursor: { parse: parseCursor, defaultValue: undefined },
		startDate: { parse: dateToIdxParser },
		endDate: { parse: dateToIdxParser },
	};

	const { skip, take, sort, startDate, endDate, cursor: cursorQuery } = castQuery(query, castQueryOptions);

	// return entire result set for monthly, but limit daily to 5 years
	if (resolution === 'daily') {
		validateDateIdxRange(startDate, endDate, config.dailyForecastVolumeYearNumberLimit);
	}
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getForecastVolumes(
		skip,
		take,
		sort,
		startDate,
		endDate,
		filters,
		project,
		forecast,
		resolution,
		cursorQuery,
	);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};
