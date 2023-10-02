import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { checkRecordCount, getValidFilters, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '../query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '../pagination';
import {
	getResponseFromErrors,
	IMultiStatusResponse,
	IRecordStatus,
	mergeResponses,
	withCounts,
} from '../multi-status';
import { getDeleteHeaders } from '../delete';
import { ValidationErrorAggregator } from '../multi-error';

import {
	ApiWell,
	filterableDeleteFields,
	filterableReadFields,
	READ_RECORD_LIMIT,
	sortableFields,
	WRITE_RECORD_LIMIT,
} from './fields';
import {
	parsePatchWell,
	parsePatchWells,
	parsePostWells,
	parsePutWell,
	parsePutWells,
	validateDeleteFilters,
	WellNotFoundError,
} from './validation';
import { CompanyWellService } from './service';

const { MULTI_STATUS, NO_CONTENT, NOT_FOUND, OK } = StatusCodes;

type Locals = { service: CompanyWellService };

const DEFAULT_PAGE_SIZE = 25;
export const IS_TRANSACTIONAL = false;

export const deleteWellById = async (req: Request, res: Response): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const wellId = parseObjectId(id);

	const deleteCount = await service.deleteWellById(wellId);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};

export const deleteWells = async (req: Request, res: Response<number>): Promise<void> => {
	const { service } = res.locals as Locals;

	const { filters } = getValidFilters(req.query, filterableDeleteFields);

	validateDeleteFilters(filters);

	const deleteCount = await service.deleteWells(filters);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};

export const getWellsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableReadFields);

	const count = await service.getWellsCount(filters, { company: true });

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getWells = async (req: Request, res: Response<ApiWell[]>): Promise<void> => {
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

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableReadFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getWells({ skip, take, sort, cursor: cursorQuery, filters }, { company: true });

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getWellById = async (req: Request, res: Response<ApiWell>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const wellId = parseObjectId(id);

	const well = await service.getById(wellId, { company: true });
	if (!well) {
		throw new WellNotFoundError(`No well was found with id \`${id}\``);
	}

	res.status(OK).json(well);
};

export const postWells = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const wells = await parsePostWells(data, service, errorAggregator);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.create(wells);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putWell = async (req: Request, res: Response<IRecordStatus>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const replace = await parsePutWell(req.body, id, service);

	const resultApiWell = replace && (await service.replaceWell(replace));

	if (!resultApiWell) {
		res.sendStatus(NOT_FOUND);
		return;
	}

	res.status(OK).json(resultApiWell);
};

export const putWells = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const { replaces, wellsToCreate } = await parsePutWells(data, service, errorAggregator);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const createResponse = await service.create(wellsToCreate);
	const replaceResponse = await service.replaceWells(replaces);
	const successResponse = mergeResponses(createResponse, replaceResponse);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).send(finalResponse);
};

export const patchWell = async (req: Request, res: Response<IRecordStatus>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const update = await parsePatchWell(req.body, id, service);

	const resultWell = update && (await service.updateWell(update));

	if (!resultWell) {
		res.sendStatus(NOT_FOUND);
		return;
	}

	res.status(OK).json(resultWell);
};

export const patchWells = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const updates = await parsePatchWells(data, service, errorAggregator);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.updateWells(updates);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).send(finalResponse);
};
