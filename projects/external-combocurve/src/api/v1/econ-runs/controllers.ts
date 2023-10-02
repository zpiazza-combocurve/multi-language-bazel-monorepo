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
import { EconRunService } from '@src/services/econ-runs-service';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { EconRunNotFoundError } from '../projects/scenarios/econ-runs/validation';

import { ApiEconRun, filterableFields, READ_RECORD_LIMIT, sortableFields } from './fields';

const { OK } = StatusCodes;
type Locals = { service: EconRunService };

const DEFAULT_PAGE_SIZE = 25;

export const getEconRunsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getEconRunsCount(filters);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getEconRuns = async (req: Request, res: Response<ApiEconRun[]>): Promise<void> => {
	const { service } = res.locals as Locals;
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
	} = await service.getEconRuns(skip, take, sort, filters, null, null, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getEconRunById = async (req: Request, res: Response<ApiEconRun>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const econRunId = parseObjectId(id);

	const econRun = await service.getById(econRunId);
	if (!econRun) {
		throw new EconRunNotFoundError(`No econ run was found with id \`${id}\``);
	}

	res.status(OK).json(econRun);
};
