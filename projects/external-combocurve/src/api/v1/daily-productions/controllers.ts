import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { checkRecordCount, getValidFilters, validatePaginationFilters } from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '../query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '../pagination';
import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '../multi-status';
import { getDeleteHeaders } from '../delete';
import { ValidationErrorAggregator } from '../multi-error';

import {
	ApiDailyProduction,
	filterableDeleteDbFields,
	filterableReadDbFields,
	READ_RECORD_LIMIT,
	sortableFields,
	WRITE_RECORD_LIMIT,
} from './fields';
import { parsePostDailyProductions, parsePutDailyProductions } from './validation';
import { CompanyDailyProductionService } from './service';

type Locals = { service: CompanyDailyProductionService };
const { MULTI_STATUS, NO_CONTENT } = StatusCodes;
const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const deleteDailyProduction = async (req: Request, res: Response<void>): Promise<void> => {
	const { service } = res.locals as Locals;

	const { filters } = getValidFilters(req.query, filterableDeleteDbFields);

	const deleteCount = await service.deleteDailyProduction(filters);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};

export const getDailyProductionHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableReadDbFields);

	const count = await service.getDailyProductionCount(filters);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getDailyProduction = async (req: Request, res: Response<ApiDailyProduction[]>): Promise<void> => {
	const { service } = res.locals as Locals;
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
	} = await service.getDailyProduction(skip, take, sort, filters, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postDailyProduction = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const production = await parsePostDailyProductions(data, service, errorAggregator);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.create(production);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putDailyProduction = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const production = await parsePutDailyProductions(data, service, errorAggregator);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(production);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};
