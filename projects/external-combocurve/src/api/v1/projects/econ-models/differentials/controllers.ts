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
	ApiDifferentials,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toDifferentials,
	WRITE_RECORD_LIMIT,
} from './fields/differentials';
import {
	checkModelDuplicates,
	DifferentialsCollisionError,
	DifferentialsNotFoundError,
	parseApiDifferentials,
} from './validation';
import { DifferentialsService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: DifferentialsService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getDifferentialsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getDifferentialsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getDifferentialById = async (req: Request, res: Response<ApiDifferentials>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const differentialsId = parseObjectId(id);

	const differentials = await service.getById(differentialsId, project);
	if (!differentials) {
		throw new DifferentialsNotFoundError(
			`No differentials model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(differentials);
};

export const getDifferentials = async (req: Request, res: Response<ApiDifferentials[]>): Promise<void> => {
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
	} = await service.getDifferentials(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postDifferentials = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiDifferentials = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid differentials model data structure', `[${index}]`);
			}
			return parseApiDifferentials(element, index);
		}),
	);

	apiDifferentials = await service.checkWells(apiDifferentials, project._id, errorAggregator);
	apiDifferentials = await service.checkScenarios(apiDifferentials, project._id, errorAggregator);

	const names = apiDifferentials.map((differentials) => differentials?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiDifferentials = apiDifferentials.filter(notNil).map((differentials, index) =>
		errorAggregator.catch(() => {
			const existName = differentials.name && existingNames.includes(differentials.name);
			if (existName) {
				throw new DifferentialsCollisionError(
					`Differentials model with name \`${differentials?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return differentials;
		}),
	);

	apiDifferentials = checkModelDuplicates(apiDifferentials, errorAggregator);

	const differentials = apiDifferentials.map(
		(differentials) => differentials && toDifferentials(differentials, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(differentials);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putDifferentials = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiDifferentials = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid differentials model data structure', `[${index}]`);
			}
			return parseApiDifferentials(element, index);
		}),
	);

	apiDifferentials = await service.checkScenarios(apiDifferentials, project._id, errorAggregator);
	apiDifferentials = await service.checkWells(apiDifferentials, project._id, errorAggregator);
	apiDifferentials = checkModelDuplicates(apiDifferentials, errorAggregator);

	const differentials = apiDifferentials.map(
		(differentials) => differentials && toDifferentials(differentials, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(differentials, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteDifferentialById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const differentialsId = parseObjectId(id);

	const deleteCount = await service.deleteDifferentialById(differentialsId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
