import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
	ApiWell,
	filterableDeleteFields,
	filterableReadFields,
	READ_RECORD_LIMIT,
	sortableFields,
} from '@src/api/v1/wells/fields';
import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import { checkRecordCount, getValidFilters, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import {
	parsePatchWell,
	parsePatchWells,
	parsePostWells,
	parsePutWell,
	parsePutWells,
	validateDeleteFilters,
	WellNotFoundError,
} from '@src/api/v1/wells/validation';
import { getUrlData } from '@src/helpers/express';
import { IS_TRANSACTIONAL } from '@src/api/v1/wells/controllers';
import { ISort } from '@src/helpers/mongo-queries';

import {
	getResponseFromErrors,
	IMultiStatusResponse,
	IRecordStatus,
	mergeResponses,
	withCounts,
} from '../../multi-status';
import { getDeleteHeaders } from '../../delete';
import { validateProjectWellLimit } from '../validation';
import { ValidationErrorAggregator } from '../../multi-error';

import { ProjectResolved, WRITE_RECORD_LIMIT } from './fields';
import { ProjectWellService } from './service';

const { MULTI_STATUS, NO_CONTENT, NOT_FOUND, OK } = StatusCodes;

type Locals = { service: ProjectWellService; project: ProjectResolved };

const DEFAULT_PAGE_SIZE = 25;

export const deleteProjectWellById = async (req: Request, res: Response): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const wellId = parseObjectId(id);

	const deleteCount = await service.deleteProjectWellById(wellId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};

export const deleteProjectWells = async (req: Request, res: Response<number>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const { filters } = getValidFilters(req.query, filterableDeleteFields);

	validateDeleteFilters(filters);

	const deleteCount = await service.deleteProjectWells(filters, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};

export const getProjectWellsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableReadFields);

	const count = await service.getWellsCount(filters, { project, company: false });

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getProjectWells = async (req: Request, res: Response<ApiWell[]>): Promise<void> => {
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

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableReadFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getWells({ skip, take, sort, filters, cursor: cursorQuery }, { project, company: false });

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getProjectWellById = async (req: Request, res: Response<ApiWell>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const wellId = parseObjectId(id);

	const well = await service.getById(wellId, { project, company: false });
	if (!well) {
		throw new WellNotFoundError(
			`No well was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(well);
};

export const postProjectWells = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const wells = await parsePostWells(data, service, errorAggregator, project._id);

	validateProjectWellLimit(project.wells, wells);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.create(wells, project._id.toString());

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putProjectWell = async (req: Request, res: Response<IRecordStatus>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;
	const projectId = project._id.toString();

	const replace = await parsePutWell(req.body, id, service, project);

	if (replace == null) {
		validateProjectWellLimit(project.wells, [replace]);
	}

	const resultApiWell = replace && (await service.replaceWell(replace, projectId));

	if (!resultApiWell) {
		res.sendStatus(NOT_FOUND);
		return;
	}

	res.status(OK).json(resultApiWell);
};

export const putProjectWells = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const projectId = project._id.toString();
	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const { replaces, wellsToCreate } = await parsePutWells(data, service, errorAggregator, project);

	validateProjectWellLimit(
		project.wells,
		wellsToCreate.filter((w) => w),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const createResponse = await service.create(wellsToCreate, projectId);
	const replaceResponse = await service.replaceWells(replaces, projectId);
	const successResponse = mergeResponses(createResponse, replaceResponse);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).send(finalResponse);
};

export const patchProjectWell = async (req: Request, res: Response<IRecordStatus>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const update = await parsePatchWell(req.body, id, service, project);

	const resultWell = update && (await service.updateWell(update, project._id.toString()));

	if (!resultWell) {
		res.sendStatus(NOT_FOUND);
		return;
	}

	res.status(OK).json(resultWell);
};

export const patchProjectWells = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const updates = await parsePatchWells(data, service, errorAggregator, project);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.updateWells(updates, project._id.toString());

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).send(finalResponse);
};
