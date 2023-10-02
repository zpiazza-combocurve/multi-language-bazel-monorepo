import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { checkRecordCount, getValidFilters, validatePaginationFilters } from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import {
	ApiMonthlyProduction,
	filterableReadDbFields,
	READ_RECORD_LIMIT,
	sortableFields,
	WRITE_RECORD_LIMIT,
} from '../../monthly-productions/fields';
import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '../../query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '../../pagination';
import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '../../multi-status';
import { parsePostMonthlyProductions, parsePutMonthlyProductions } from '../../monthly-productions/validation';
import { BaseProjectResolved } from '../fields';
import { ValidationErrorAggregator } from '../../multi-error';

import { ProjectMonthlyProductionService } from './service';

const { MULTI_STATUS } = StatusCodes;

type Locals = { service: ProjectMonthlyProductionService; project: BaseProjectResolved };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getProjectMonthlyProductionHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableReadDbFields);

	const count = await service.getMonthlyProductionCount(filters, project._id);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getProjectMonthlyProduction = async (
	req: Request,
	res: Response<ApiMonthlyProduction[]>,
): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	validatePaginationFilters(query);

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
		sort: { parse: SortParser(sortableFields), defaultValue: {} as ISort },
		cursor: { parse: parseCursor, defaultValue: undefined },
	};

	const { skip, take, sort, cursor: cursorQuery } = castQuery(query, castQueryOptions);

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableReadDbFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getMonthlyProduction(skip, take, sort, filters, cursorQuery, project._id);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postProjectMonthlyProduction = async (
	req: Request,
	res: Response<IMultiStatusResponse>,
): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const projectId = project._id.toString();

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const production = await parsePostMonthlyProductions(data, service, errorAggregator, project);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.create(production, projectId);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putProjectMonthlyProduction = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const projectId = project._id.toString();

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const production = await parsePutMonthlyProductions(data, service, errorAggregator, project);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(production, projectId);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};
