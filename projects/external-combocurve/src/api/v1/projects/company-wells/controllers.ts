import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiWell, filterableReadFields, sortableFields } from '@src/api/v1/wells/fields';
import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import { checkRecordCount, getValidFilters, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { validateDeleteFilters, WellNotFoundError } from '@src/api/v1/wells/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '../../multi-status';
import { getDeleteHeaders } from '../../delete';
import { validateProjectWellLimit } from '../validation';
import { ValidationErrorAggregator } from '../../multi-error';

import { filterableDeleteFields, READ_RECORD_LIMIT, WRITE_RECORD_LIMIT } from './fields';
import { parsePostProjectCompanyWells } from './validation';
import { ProjectCompanyWellService } from './service';
import { ProjectResolved } from './fields';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: ProjectCompanyWellService; project: ProjectResolved };

const DEFAULT_PAGE_SIZE = 25;

export const getProjectCompanyWellsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableReadFields);

	const count = await service.getWellsCount(filters, { project, company: true });

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getProjectCompanyWells = async (req: Request, res: Response<ApiWell[]>): Promise<void> => {
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
	} = await service.getWells({ skip, take, sort, filters, cursor: cursorQuery }, { project, company: true });

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getProjectCompanyWellById = async (req: Request, res: Response<ApiWell>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const wellId = parseObjectId(id);

	const well = await service.getById(wellId, { project, company: true });
	if (!well) {
		throw new WellNotFoundError(
			`No well was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(well);
};

export const postProjectCompanyWells = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const wells = await parsePostProjectCompanyWells(data, service, errorAggregator, project);

	validateProjectWellLimit(project.wells, wells);

	const successResponse = await service.addCompanyWellsToProject(wells, project._id.toString());

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));

	res.status(MULTI_STATUS).send(finalResponse);
};

export const deleteProjectCompanyWells = async (req: Request, res: Response): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const { filters } = getValidFilters(req.query, filterableDeleteFields);

	validateDeleteFilters(filters);

	const deleteCount = await service.deleteCompanyWellsFromProject(filters, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
