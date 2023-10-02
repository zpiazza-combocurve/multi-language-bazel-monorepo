import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import {
	checkRecordCount,
	getValidFilters,
	isObject,
	parseObjectId,
	RequestStructureError,
	validatePaginationFilters,
} from '@src/helpers/validation';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '@src/api/v1/multi-status';
import { getDeleteHeaders } from '@src/api/v1/delete';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { BaseProjectResolved } from '../../fields';
import { EconModelService } from '../service';

import {
	ApiCapex,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toCapex,
	WRITE_RECORD_LIMIT,
} from './fields/capex';
import { CapexCollisionError, CapexNotFoundError, checkModelDuplicates, parseApiCapex } from './validation';
import { CapexService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: CapexService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getCapexHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getCapexCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getCapexById = async (req: Request, res: Response<ApiCapex>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const capexId = parseObjectId(id);

	const capex = await service.getById(capexId, project);
	if (!capex) {
		throw new CapexNotFoundError(
			`No Capex model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(capex);
};

export const getCapex = async (req: Request, res: Response<ApiCapex[]>): Promise<void> => {
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

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getCapex(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postCapex = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiCapex = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Capex model data structure', `[${index}]`);
			}
			return parseApiCapex(element, index);
		}),
	);

	apiCapex = await service.checkWells(apiCapex, project._id, errorAggregator);
	apiCapex = await service.checkScenarios(apiCapex, project._id, errorAggregator);

	const names = apiCapex.map((capex) => capex?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiCapex = apiCapex.filter(notNil).map((capex, index) =>
		errorAggregator.catch(() => {
			const existName = capex.name && existingNames.includes(capex.name);
			if (existName) {
				throw new CapexCollisionError(
					`Capex model with name \`${capex?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return capex;
		}),
	);

	apiCapex = checkModelDuplicates(apiCapex, errorAggregator);

	const capex = apiCapex.map((capex) => capex && toCapex(capex, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(capex);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putCapex = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiCapex = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Capex model data structure', `[${index}]`);
			}
			return parseApiCapex(element, index);
		}),
	);

	apiCapex = await service.checkScenarios(apiCapex, project._id, errorAggregator);
	apiCapex = await service.checkWells(apiCapex, project._id, errorAggregator);
	apiCapex = checkModelDuplicates(apiCapex, errorAggregator);

	const capex = apiCapex.map((capex) => capex && toCapex(capex, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(capex, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteCapexById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const capexId = parseObjectId(id);

	const deleteCount = await service.deleteCapexById(capexId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
